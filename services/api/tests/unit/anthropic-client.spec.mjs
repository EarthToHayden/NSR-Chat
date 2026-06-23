import test from 'node:test'
import assert from 'node:assert/strict'
import { createAnthropicClient } from '../../src/modules/providers/anthropic-client.mjs'

// Fake SDK client: records the params it was called with, then replays the
// given raw stream events. No network, no real key.
function fakeAnthropic(events, capture = {}) {
    return {
        messages: {
            stream(params) {
                capture.params = params
                return (async function* () {
                    for (const event of events) yield event
                })()
            },
        },
    }
}

test('anthropic client: maps messages + system, streams text, ignores thinking', async () => {
    const capture = {}
    const anthropic = fakeAnthropic(
        [
            { type: 'message_start' },
            { type: 'content_block_delta', delta: { type: 'thinking_delta', thinking: 'reasoning' } },
            { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
            { type: 'content_block_delta', delta: { type: 'text_delta', text: ' world' } },
            { type: 'message_delta', delta: { stop_reason: 'end_turn' } },
            { type: 'message_stop' },
        ],
        capture,
    )

    const client = createAnthropicClient({
        apiKey: 'sk-test',
        model: 'claude-opus-4-8',
        maxTokens: 16000,
        systemPrompt: 'SYSTEM',
        thinking: 'off',
        anthropic,
    })

    const events = []
    for await (const event of client.streamMessage({
        messages: [
            { id: 'm1', conversationId: 'c1', role: 'user', content: 'hi', createdAt: 't' },
        ],
    })) {
        events.push(event)
    }

    // Request shaping: only role+content sent; system is separate; no thinking param when off.
    assert.equal(capture.params.model, 'claude-opus-4-8')
    assert.equal(capture.params.max_tokens, 16000)
    assert.equal(capture.params.system, 'SYSTEM')
    assert.deepEqual(capture.params.messages, [{ role: 'user', content: 'hi' }])
    assert.equal(capture.params.thinking, undefined)

    // Event translation: thinking_delta ignored, text_deltas concatenated.
    assert.equal(events[0].type, 'message_start')
    const text = events.filter((e) => e.type === 'content_delta').map((e) => e.text).join('')
    assert.equal(text, 'Hello world')
    assert.equal(events.at(-1).type, 'message_done')
    assert.equal(events.at(-1).done, true)
})

test('anthropic client: adaptive thinking adds the thinking param', async () => {
    const capture = {}
    const anthropic = fakeAnthropic([{ type: 'message_start' }, { type: 'message_stop' }], capture)
    const client = createAnthropicClient({
        apiKey: 'sk-test', model: 'm', maxTokens: 1, systemPrompt: 's',
        thinking: 'adaptive', anthropic,
    })
    for await (const _event of client.streamMessage({ messages: [] })) { /* drain */ }
    assert.deepEqual(capture.params.thinking, { type: 'adaptive' })
})

test('anthropic client: refusal stop_reason throws', async () => {
    const anthropic = fakeAnthropic([
        { type: 'message_start' },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'partial' } },
        { type: 'message_delta', delta: { stop_reason: 'refusal' } },
    ])
    const client = createAnthropicClient({
        apiKey: 'sk-test', model: 'm', maxTokens: 1, systemPrompt: 's', anthropic,
    })
    await assert.rejects(async () => {
        for await (const _event of client.streamMessage({ messages: [] })) { /* drain */ }
    }, /declined/i)
})

test('anthropic client: upstream errors propagate (not swallowed)', async () => {
    const anthropic = {
        messages: {
            stream() {
                return (async function* () { throw new Error('boom from SDK') })()
            },
        },
    }
    const client = createAnthropicClient({
        apiKey: 'sk-test', model: 'm', maxTokens: 1, systemPrompt: 's', anthropic,
    })
    await assert.rejects(async () => {
        for await (const _event of client.streamMessage({ messages: [] })) { /* drain */ }
    }, /boom from SDK/)
})

test('anthropic client: retries a retryable error before the first token, then succeeds', async () => {
    const sleeps = []
    let calls = 0
    const anthropic = {
        messages: {
            stream() {
                calls += 1
                if (calls === 1) {
                    return (async function* () {
                        const err = new Error('overloaded')
                        err.status = 529
                        throw err
                    })()
                }
                return (async function* () {
                    yield { type: 'message_start' }
                    yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'ok' } }
                    yield { type: 'message_stop' }
                })()
            },
        },
    }
    const client = createAnthropicClient({
        apiKey: 'k', model: 'm', maxTokens: 1, systemPrompt: 's', anthropic,
        retryMaxAttempts: 3, retryBaseMs: 10,
        sleep: async (ms) => { sleeps.push(ms) },
    })

    const events = []
    for await (const e of client.streamMessage({ messages: [] })) events.push(e)

    assert.equal(calls, 2)                  // failed once, retried, succeeded
    assert.deepEqual(sleeps, [10])          // one backoff of baseMs
    const text = events.filter((e) => e.type === 'content_delta').map((e) => e.text).join('')
    assert.equal(text, 'ok')
})

test('anthropic client: honors Retry-After header for the backoff delay', async () => {
    const sleeps = []
    let calls = 0
    const anthropic = {
        messages: {
            stream() {
                calls += 1
                if (calls === 1) {
                    return (async function* () {
                        const err = new Error('rate limited')
                        err.status = 429
                        err.headers = { 'retry-after': '2' }
                        throw err
                    })()
                }
                return (async function* () {
                    yield { type: 'message_start' }
                    yield { type: 'message_stop' }
                })()
            },
        },
    }
    const client = createAnthropicClient({
        apiKey: 'k', model: 'm', maxTokens: 1, systemPrompt: 's', anthropic,
        retryMaxAttempts: 3, retryBaseMs: 10,
        sleep: async (ms) => { sleeps.push(ms) },
    })
    for await (const _e of client.streamMessage({ messages: [] })) { /* drain */ }
    assert.deepEqual(sleeps, [2000])        // 2s from Retry-After, not baseMs
})

test('anthropic client: gives up after retryMaxAttempts retryable failures', async () => {
    let calls = 0
    const anthropic = {
        messages: {
            stream() {
                calls += 1
                return (async function* () {
                    const err = new Error('still rate limited')
                    err.status = 429
                    throw err
                })()
            },
        },
    }
    const client = createAnthropicClient({
        apiKey: 'k', model: 'm', maxTokens: 1, systemPrompt: 's', anthropic,
        retryMaxAttempts: 3, retryBaseMs: 1, sleep: async () => {},
    })
    await assert.rejects(async () => {
        for await (const _e of client.streamMessage({ messages: [] })) { /* drain */ }
    }, /still rate limited/)
    assert.equal(calls, 3)                  // 3 total attempts, then give up
})

test('anthropic client: does not retry a non-retryable (4xx) error', async () => {
    let calls = 0
    const anthropic = {
        messages: {
            stream() {
                calls += 1
                return (async function* () {
                    const err = new Error('bad request')
                    err.status = 400
                    throw err
                })()
            },
        },
    }
    const client = createAnthropicClient({
        apiKey: 'k', model: 'm', maxTokens: 1, systemPrompt: 's', anthropic,
        retryMaxAttempts: 3, retryBaseMs: 1, sleep: async () => {},
    })
    await assert.rejects(async () => {
        for await (const _e of client.streamMessage({ messages: [] })) { /* drain */ }
    }, /bad request/)
    assert.equal(calls, 1)                  // no retry on 4xx
})

test('anthropic client: does not retry once streaming has started', async () => {
    let calls = 0
    const anthropic = {
        messages: {
            stream() {
                calls += 1
                return (async function* () {
                    yield { type: 'message_start' }
                    yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'partial' } }
                    const err = new Error('mid-stream blowup')
                    err.status = 500            // retryable status, but too late
                    throw err
                })()
            },
        },
    }
    const client = createAnthropicClient({
        apiKey: 'k', model: 'm', maxTokens: 1, systemPrompt: 's', anthropic,
        retryMaxAttempts: 3, retryBaseMs: 1, sleep: async () => {},
    })
    const events = []
    await assert.rejects(async () => {
        for await (const e of client.streamMessage({ messages: [] })) events.push(e)
    }, /mid-stream blowup/)
    assert.equal(calls, 1)                  // no retry despite retryable status
    assert.equal(events[0].type, 'message_start')
})

test('anthropic client: forwards the abort signal and does not retry on abort', async () => {
    let calls = 0
    let receivedSignal
    const controller = new AbortController()
    const anthropic = {
        messages: {
            stream(_params, options) {
                calls += 1
                receivedSignal = options?.signal
                return (async function* () {
                    controller.abort()
                    const err = new Error('aborted mid-stream')
                    err.status = 500            // looks retryable, but abort wins
                    throw err
                })()
            },
        },
    }
    const client = createAnthropicClient({
        apiKey: 'k', model: 'm', maxTokens: 1, systemPrompt: 's', anthropic,
        retryMaxAttempts: 3, retryBaseMs: 1, sleep: async () => {},
    })
    await assert.rejects(async () => {
        for await (const _e of client.streamMessage({ messages: [], signal: controller.signal })) { /* drain */ }
    })
    assert.equal(receivedSignal, controller.signal)  // signal forwarded to SDK
    assert.equal(calls, 1)                            // abort short-circuits retry
})