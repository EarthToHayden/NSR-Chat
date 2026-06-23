import test from 'node:test'
import assert from 'node:assert/strict'
import { createChatRoutes } from '../../src/modules/chat/routes.mjs'

function fakeReq(body) {
    return {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        async *[Symbol.asyncIterator]() {
            yield Buffer.from(JSON.stringify(body))
        },
    }
}

function fakeRes() {
    const res = {
        statusCode: undefined,
        chunks: [],
        ended: false,
        closeHandlers: [],
        writeHead(status, headers) { res.statusCode = status; res.headers = headers },
        write(chunk) { res.chunks.push(chunk) },
        end(chunk) { if (chunk !== undefined) res.chunks.push(chunk); res.ended = true },
        on(event, handler) { if (event === 'close') res.closeHandlers.push(handler) },
        events() {
            return res.chunks.join('').split('\n').filter(Boolean).map((l) => JSON.parse(l))
        },
    }
    return res
}

function fakeRepo({ conversation, history }) {
    const appended = []
    return {
        appended,
        getConversationById: () => conversation,
        appendMessage: (m) => { appended.push(m); return { id: 'msg_x', createdAt: 't', ...m } },
        listMessagesByConversationId: () => history,
    }
}

test('chat route: sends the full conversation history to the provider', async () => {
    const history = [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'reply' },
        { role: 'user', content: 'second' },
    ]
    const repo = fakeRepo({ conversation: { id: 'c1' }, history })
    let received
    const provider = {
        async *streamMessage(input) {
            received = input
            yield { type: 'start' }
            yield { type: 'delta', chunk: 'hi' }
            yield { type: 'done', done: true }
        },
    }
    const [route] = createChatRoutes({ conversationRepo: repo, provider })
    const res = fakeRes()
    await route.handler(fakeReq({ role: 'user', content: 'second' }), res, { conversationId: 'c1' })

    assert.deepEqual(received.messages, history)        // full thread, not just latest turn
    assert.equal(res.statusCode, 200)
    assert.ok(repo.appended.some((m) => m.role === 'assistant' && m.content === 'hi'))
})

test('chat route: a failure before the first event returns an HTTP error, not 200', async () => {
    const repo = fakeRepo({ conversation: { id: 'c1' }, history: [{ role: 'user', content: 'x' }] })
    const provider = {
        async *streamMessage() { throw new Error('upstream down') },
    }
    const [route] = createChatRoutes({ conversationRepo: repo, provider })
    const res = fakeRes()
    await route.handler(fakeReq({ role: 'user', content: 'x' }), res, { conversationId: 'c1' })

    assert.notEqual(res.statusCode, 200)
    assert.ok(res.statusCode >= 400)
    assert.ok(res.ended)
})

test('chat route: a mid-stream failure emits an error event and ends', async () => {
    const repo = fakeRepo({ conversation: { id: 'c1' }, history: [{ role: 'user', content: 'x' }] })
    const provider = {
        async *streamMessage() {
            yield { type: 'start' }
            yield { type: 'delta', chunk: 'partial' }
            throw new Error('mid-stream boom')
        },
    }
    const [route] = createChatRoutes({ conversationRepo: repo, provider })
    const res = fakeRes()
    await route.handler(fakeReq({ role: 'user', content: 'x' }), res, { conversationId: 'c1' })

    assert.equal(res.statusCode, 200)                   // header already committed
    const events = res.events()
    assert.equal(events.at(-1).type, 'error')
    assert.match(events.at(-1).error, /mid-stream boom/)
    assert.ok(res.ended)
})
