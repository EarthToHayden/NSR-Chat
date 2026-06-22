import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { createServer } from '../../src/server/create-server.mjs'

function requestJson(port, method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')
          resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null })
        })
      },
    )

    req.on('error', reject)
    req.end()
  })
}

test('auth and library routes are explicit placeholders', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'nsr-task9-'))
  const dbPath = join(dir, 'task9.sqlite')
  const server = createServer({ startedAt: Date.now(), dbPath })

  const address = await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address()))
  })

  try {
    const authRes = await requestJson(address.port, 'GET', '/api/auth/session')
    assert.equal(authRes.status, 501)
    assert.match(authRes.body.error.message, /not implemented/i)

    const libraryRes = await requestJson(address.port, 'GET', '/api/library/search?q=test')
    assert.equal(libraryRes.status, 501)
    assert.match(libraryRes.body.error.message, /not implemented/i)
  } finally {
    await new Promise((resolve) => server.close(resolve))
    rmSync(dir, { recursive: true, force: true })
  }
})