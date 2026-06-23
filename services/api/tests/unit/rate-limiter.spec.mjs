import test from 'node:test'
import assert from 'node:assert/strict'
import { createRateLimiter } from '../../src/lib/rate-limiter.mjs'

test('rate limiter: allows up to max within the window, blocks beyond', () => {
    let clock = 1000
    const limiter = createRateLimiter({ max: 2, windowMs: 100, now: () => clock })

    assert.equal(limiter.check('a').allowed, true)
    assert.equal(limiter.check('a').allowed, true)
    const blocked = limiter.check('a')
    assert.equal(blocked.allowed, false)
    assert.equal(blocked.retryAfterMs, 100)
})

test('rate limiter: resets after the window elapses', () => {
    let clock = 1000
    const limiter = createRateLimiter({ max: 1, windowMs: 100, now: () => clock })

    assert.equal(limiter.check('a').allowed, true)
    assert.equal(limiter.check('a').allowed, false)
    clock = 1100 // window elapsed
    assert.equal(limiter.check('a').allowed, true)
})

test('rate limiter: tracks keys independently', () => {
    let clock = 1000
    const limiter = createRateLimiter({ max: 1, windowMs: 100, now: () => clock })

    assert.equal(limiter.check('a').allowed, true)
    assert.equal(limiter.check('b').allowed, true)   // different key, own budget
    assert.equal(limiter.check('a').allowed, false)
})
