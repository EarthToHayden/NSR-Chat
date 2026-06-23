import test from 'node:test'
import assert from 'node:assert/strict'
import { createConcurrencyLimiter } from '../../src/lib/concurrency-limiter.mjs'

test('concurrency limiter: allows up to max, rejects beyond', () => {
    const limiter = createConcurrencyLimiter({ max: 2 })
    assert.equal(limiter.acquire('a'), true)
    assert.equal(limiter.acquire('a'), true)
    assert.equal(limiter.acquire('a'), false)   // at cap
})

test('concurrency limiter: release frees a slot', () => {
    const limiter = createConcurrencyLimiter({ max: 1 })
    assert.equal(limiter.acquire('a'), true)
    assert.equal(limiter.acquire('a'), false)
    limiter.release('a')
    assert.equal(limiter.acquire('a'), true)     // slot freed
})

test('concurrency limiter: tracks keys independently', () => {
    const limiter = createConcurrencyLimiter({ max: 1 })
    assert.equal(limiter.acquire('a'), true)
    assert.equal(limiter.acquire('b'), true)     // different key
})

test('concurrency limiter: release never goes negative', () => {
    const limiter = createConcurrencyLimiter({ max: 1 })
    limiter.release('a')                          // release with nothing acquired
    assert.equal(limiter.acquire('a'), true)      // still works
})