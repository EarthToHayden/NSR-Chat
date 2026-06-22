import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import http from 'node:http'

import { createServer } from '../../src/server/create-server.mjs'

function requestJson(port, method, path, body) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null
        const req = http.request(
            {
                hostname: '127.0.0.1',
                port,
                path,
                method,
                headers: payload
                    ? {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(payload),
                      }
                    : {},
            },
            (res) => {
                const chunks = []
                res.on('data', (chunk) => chunks.push(chunk))
                res.on('end', () => {
                    const raw = Buffer.concat(chunks).toString('utf-8')
                    const parsed = raw ? JSON.parse(raw): null
                    resolve({ status: res.statusCode, body: parsed })
                })
            }
        )
        req.on('error', reject)
        if (payload) req.write(payload)
        req.end()
    })
}

function requestTextStream(port, method, path, body) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null
        const req = http.request(
            {
                hostname: '127.0.0.1',
                port,
                path,
                method,
                headers: payload
                    ? {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(payload),
                      }
                    : {},
            },
            (res) => {
                const chunks = []
                res.on('data', (chunk) => chunks.push(chunk))
                res.on('end', () => {
                    resolve({
                        status: res.statusCode,
                        body: Buffer.concat(chunks).toString('utf-8'),
                    })
                })
            }
        )
        req.on('error', reject)
        if (payload) req.write(payload)
        req.end()
    })
}

test('chat stream persists user message, streams assistant, then persists assistant', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'nsr-api-chat-'))
    const dbPath = join(dir, 'chat.sqlite')
    const startedAt = Date.now()
    const server = createServer({ startedAt, dbPath })

    const listenResult = await new Promise((resolve) => {
        server.listen(0, '127.0.0.1', () => {
            const address = server.address()
            resolve(address)
        })
    })

    const port = listenResult.port
    
    try {
        const created = await requestJson(port, 'POST', '/api/conversations', {
            title: 'Streaming Test',
        })
        assert.equal(created.status, 201)
        const conversationId = created.body.id

        const streamRes = await requestTextStream(
            port,
            'POST',
            `/api/conversations/${conversationId}/chat/stream`,
            { role: 'user', content: 'Hello stream' }
        )

        assert.equal(streamRes.status, 200)
        assert.match(streamRes.body, /"type":"start"/)
        assert.match(streamRes.body, /"type":"delta"/)
        assert.match(streamRes.body, /"type":"done"/)

        const convo = await requestJson(port, 'GET', `/api/conversations/${conversationId}`)
        assert.equal(convo.status, 200)
        assert.equal(convo.body.messages.length, 2)
        assert.equal(convo.body.messages[0].role, 'user')
        assert.equal(convo.body.messages[0].content, 'Hello stream')
        assert.equal(convo.body.messages[1].role, 'assistant')
        assert.ok(convo.body.messages[1].content.length > 0)
    } finally {
        await new Promise((resolve) => server.close(resolve))
        rmSync(dir, {recursive: true, force: true, maxRetries: 10, retryDelay: 50})
    }
})