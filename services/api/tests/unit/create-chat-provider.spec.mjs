import test from 'node:test'
import assert from 'node:assert/strict'
import { createChatProvider } from '../../src/modules/providers/create-chat-provider.mjs'

async function collectText(provider) {
    const events = []
    for await (const event of provider.streamMessage({
        conversationId: 'conv_1',
        messageId: 'msg_1',
        messages: [],
    })) {
        events.push(event)
    }
    const text = events
        .filter((e) => e.type === 'delta')
        .map((e) => e.chunk)
        .join('')
    return { events, text }
}

test('createChatProvider: uses the stub client when no API key', async () => {
    const provider = createChatProvider()
    const { events, text } = await collectText(provider)

    assert.equal(events[0].type, 'start')
    assert.equal(events.at(-1).type, 'done')
    assert.equal(text, 'Stub assistant response.')
})

test('createChatProvider: uses the injected real client factory when a key is present', async () => {
    let receivedConfig = null
    const fakeRealClient = {
        async *streamMessage() {
            yield { type: 'message_start' }
            yield { type: 'content_delta', text: 'real' }
            yield { type: 'message_done', done: true }
        },
    }
    const createRealClient = (config) => {
        receivedConfig = config
        return fakeRealClient
    }

    const provider = createChatProvider({
        apiKey: 'sk-ant-test',
        createRealClient,
        realClientConfig: { model: 'claude-opus-4-8' },
    })
    const { text } = await collectText(provider)

    assert.deepEqual(receivedConfig, { model: 'claude-opus-4-8' })
    assert.equal(text, 'real')
})

test('createChatProvider: falls back to stub if key is present but no real factory', async () => {
    const provider = createChatProvider({ apiKey: 'sk-ant-test' })
    const { text } = await collectText(provider)
    assert.equal(text, 'Stub assistant response.')
})
