import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import http from 'node:http'

import { createServer } from '../../src/server/create-server.mjs'

function request(port, method, path, body) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null
        const req = http.request(
            {
                hostname: '127.0.0.1',
                port,
                path,
                method,
                headers: payload
                    ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
                    : {},
            },
            (res) => {
                const chunks = []
                res.on('data', (c) => chunks.push(c))
                res.on('end', () =>
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: Buffer.concat(chunks).toString('utf-8'),
                    }),
                )
            },
        )
        req.on('error', reject)
        if (payload) req.write(payload)
        req.end()
    })
}

async function withServer(options, fn) {
    const dir = mkdtempSync(join(tmpdir(), 'nsr-api-limits-'))
    const dbPath = join(dir, 'limits.sqlite')
    const server = createServer({ startedAt: Date.now(), dbPath, ...options })
    const { port } = await new Promise((resolve) =>
        server.listen(0, '127.0.0.1', () => resolve(server.address())),
    )
    try {
        await fn(port)
    } finally {
        await new Promise((resolve) => server.close(resolve))
        rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
    }
}

test('integration: exceeding the rate limit returns 429 with Retry-After', async () => {
    await withServer({ limits: { rateLimitMax: 1, rateLimitWindowMs: 60000 } }, async (port) => {
        const created = await request(port, 'POST', '/api/conversations', { title: 'limit' })
        const conversationId = JSON.parse(created.body).id

        // First chat request uses the single token (stub streams a response).
        const first = await request(port, 'POST', `/api/conversations/${conversationId}/chat/stream`, { role: 'user', content: 'hi' })
        assert.equal(first.status, 200)

        // Second is over the rate limit.
        const second = await request(port, 'POST', `/api/conversations/${conversationId}/chat/stream`, { role: 'user', content: 'again' })
        assert.equal(second.status, 429)
        assert.ok(second.headers['retry-after'])
    })
})

test('integration: a concurrency cap of 0 rejects chat with 429', async () => {
    await withServer({ limits: { maxConcurrentPerUser: 0 } }, async (port) => {
        const created = await request(port, 'POST', '/api/conversations', { title: 'limit' })
        const conversationId = JSON.parse(created.body).id

        const res = await request(port, 'POST', `/api/conversations/${conversationId}/chat/stream`, { role: 'user', content: 'hi' })
        assert.equal(res.status, 429)
    })
})