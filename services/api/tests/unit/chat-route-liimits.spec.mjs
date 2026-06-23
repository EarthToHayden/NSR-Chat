import test from 'node:test'
import assert from 'node:assert/strict'
import { createChatRoutes } from '../../src/modules/chat/routes.mjs'
import { createRateLimiter } from '../../src/lib/rate-limiter.mjs'
import { createConcurrencyLimiter } from '../../src/lib/concurrency-limiter.mjs'

const KEY = '1.2.3.4'

function fakeReq(body) {
    return {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        socket: { remoteAddress: KEY },
        async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(body)) },
    }
}

function fakeRes() {
    const res = {
        statusCode: undefined,
        headers: undefined,
        chunks: [],
        ended: false,
        writeHead(status, headers) { res.statusCode = status; res.headers = headers },
        write(chunk) { res.chunks.push(chunk) },
        end(chunk) { if (chunk !== undefined) res.chunks.push(chunk); res.ended = true },
        on() {},
    }
    return res
}

function fakeRepo() {
    return {
        getConversationById: () => ({ id: 'c1' }),
        appendMessage: (m) => ({ id: 'msg_x', createdAt: 't', ...m }),
        listMessagesByConversationId: () => [],
    }
}

function okProvider() {
    return {
        async *streamMessage() {
            yield { type: 'start' }
            yield { type: 'delta', chunk: 'hi' }
            yield { type: 'done', done: true }
        },
    }
}

test('chat route: 429 + Retry-After when the rate limit is exceeded', async () => {
    const rateLimiter = createRateLimiter({ max: 1, windowMs: 60000, now: () => 1000 })
    const concurrencyLimiter = createConcurrencyLimiter({ max: 10 })
    const [route] = createChatRoutes({ conversationRepo: fakeRepo(), provider: okProvider(), rateLimiter, concurrencyLimiter })

    await route.handler(fakeReq({ role: 'user', content: 'x' }), fakeRes(), { conversationId: 'c1' }) // uses the 1 token
    const res = fakeRes()
    await route.handler(fakeReq({ role: 'user', content: 'x' }), res, { conversationId: 'c1' })         // over limit

    assert.equal(res.statusCode, 429)
    assert.ok(res.headers['Retry-After'])
})

test('chat route: 429 when the concurrency cap is exceeded', async () => {
    const rateLimiter = createRateLimiter({ max: 100, windowMs: 60000 })
    const concurrencyLimiter = createConcurrencyLimiter({ max: 1 })
    concurrencyLimiter.acquire(KEY) // pre-occupy the only slot (simulating an in-flight request)

    const [route] = createChatRoutes({ conversationRepo: fakeRepo(), provider: okProvider(), rateLimiter, concurrencyLimiter })
    const res = fakeRes()
    await route.handler(fakeReq({ role: 'user', content: 'x' }), res, { conversationId: 'c1' })

    assert.equal(res.statusCode, 429)
})

test('chat route: releases the concurrency slot after a successful stream', async () => {
    const rateLimiter = createRateLimiter({ max: 100, windowMs: 60000 })
    const concurrencyLimiter = createConcurrencyLimiter({ max: 1 })
    const [route] = createChatRoutes({ conversationRepo: fakeRepo(), provider: okProvider(), rateLimiter, concurrencyLimiter })

    await route.handler(fakeReq({ role: 'user', content: 'x' }), fakeRes(), { conversationId: 'c1' })
    assert.equal(concurrencyLimiter.acquire(KEY), true) // slot was freed
})

test('chat route: releases the concurrency slot even when the stream errors', async () => {
    const rateLimiter = createRateLimiter({ max: 100, windowMs: 60000 })
    const concurrencyLimiter = createConcurrencyLimiter({ max: 1 })
    const provider = { async *streamMessage() { throw new Error('boom') } }
    const [route] = createChatRoutes({ conversationRepo: fakeRepo(), provider, rateLimiter, concurrencyLimiter })

    await route.handler(fakeReq({ role: 'user', content: 'x' }), fakeRes(), { conversationId: 'c1' })
    assert.equal(concurrencyLimiter.acquire(KEY), true) // freed despite error
})
