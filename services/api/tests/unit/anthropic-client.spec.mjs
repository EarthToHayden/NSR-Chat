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
