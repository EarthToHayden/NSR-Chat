import { readJsonBody } from '../../server/request-body.mjs'
import { requireJsonContentType } from '../../middleware/require-json.mjs'
import { resolveUserKey } from '../../lib/resolve-user-key.mjs'


function writeNdjson(res, payload) {
    res.write(`${JSON.stringify(payload)}\n`)
}

function sendJsonStatus(res, statusCode, payload, extraHeaders = {}) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders })
    res.end(JSON.stringify(payload))
}

function validateBody(body) {
    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
        const err = new Error('content is required and must be a non-empty string')
        err.statusCode = 400
        throw err
    }

    if (body.role !== 'user') {
        const err = new Error('role must be user for stream input')
        err.statusCode = 400
        throw err
    }
}

export function createChatRoutes({ conversationRepo, provider, rateLimiter, concurrencyLimiter, trustProxyHeader = false }) {
    return [
        {
            method: 'POST',
            path: '/api/conversations/:conversationId/chat/stream',
            handler: async (req, res, params) => {
                requireJsonContentType(req)

                const userKey = resolveUserKey(req, { trustProxyHeader })

                // Rate limit first - cheapest rejection, before any DB or body work
                if (rateLimiter) {
                    const { allowed, retryAfterMs } = rateLimiter.check(userKey)
                    if (!allowed) {
                        sendJsonStatus(
                            res,
                            429,
                            { error: { message: 'Rate limit exceeded. Please slow down.' } },
                            { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
                        )
                        return
                    }
                }

                const conversation = conversationRepo.getConversationById(params.conversationId)
                if (!conversation) {
                    sendJsonStatus(res, 404, { error: { message: 'Conversation not found' } })
                    return
                }

                const body = await readJsonBody(req)
                validateBody(body)

                // Concurrency cap: hold a slot for the duration of the stream.
                // Reject before any upstream call if at capacity; release in 'finally'
                let acquired = false
                if (concurrencyLimiter) {
                    acquired = concurrencyLimiter.acquire(userKey)
                    if (!acquired) {
                        sendJsonStatus(res, 429, {
                            error: { message: 'Too many concurrent requests. Please wait for an in-flight request to finish.' },
                        })
                        return
                    }
                }

                try {
                    // Persist the user's message, then load the full thread so the model
                    // gets the whole conversation as context (not just this turn)
                    conversationRepo.appendMessage({
                        conversationId: params.conversationId,
                        role: 'user',
                        content: body.content.trim(),
                    })

                    const history = conversationRepo.listMessagesByConversationId(params.conversationId)

                    const assistantMessageId = `msg_assistant_${Date.now()}`
                    let assistantText = ''

                    // Abort the upstream call if the client disconnects, so an
                    // abandoned stream stops consuming tokens
                    const abortController = new AbortController()
                    res.on('close', () => abortController.abort())

                    // Write the 200 + NDJSON header lazily on the first event, so a
                    // failure BEFORE streaming begins can return a real HTTP status
                    // instead of a half-open stream
                    let headerWritten = false
                    const ensureStreamHeader = () => {
                        if (headerWritten) return
                        res.writeHead(200, {
                            'Content-Type': 'application/x-ndjson; charset=utf-8',
                            'Cache-Control': 'no-cache',
                            Connection: 'keep-alive',
                        })
                        headerWritten = true
                    }

                    const persistAssistant = () => {
                        if (!assistantText) return
                        conversationRepo.appendMessage({
                            conversationId: params.conversationId,
                            role: 'assistant',
                            content: assistantText,
                        })
                    }
                    try {
                            for await (const event of provider.streamMessage({
                            conversationId: params.conversationId,
                            messageId: assistantMessageId,
                            messages: history,
                            signal: abortController.signal,
                        })) {
                            ensureStreamHeader()
                            if (event.type === 'delta') {
                                assistantText += event.chunk ?? ''
                            }
                            writeNdjson(res, event)
                        }
                    } catch (error) {
                        // Client disconnected, persist whatever streamed; nothing to send
                        if (abortController.signal.aborted) {
                            persistAssistant()
                            return
                        }

                        // Failed before any byte went out. Real HTTP error
                        if (!headerWritten) {
                            const statusCode = error.code === 'refusal' ? 422 : 502
                            res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
                            res.end(JSON.stringify({ error: { message: error.message } }))
                            return
                        }

                        // Failed mid-stream, surface an error event in the open stream
                        persistAssistant()
                        writeNdjson(res, {
                            type: 'error',
                            conversationId: params.conversationId,
                            messageId: assistantMessageId,
                            error: error.message,
                            timestamp: new Date().toISOString(),
                        })
                        res.end()
                        return
                    }

                    persistAssistant()
                    res.end()
                } finally {
                    if (acquired) concurrencyLimiter.release(userKey)
                }
            },
        },
    ]
}