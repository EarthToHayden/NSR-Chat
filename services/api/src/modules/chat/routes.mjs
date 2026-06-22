import { readJsonBody } from '../../server/request-body.mjs'
import { requireJsonContentType } from '../../middleware/require-json.mjs'
import { createClaudeProvider } from '../providers/claude-provider.mjs'

function writeNdjson(res, payload) {
    res.write(`${JSON.stringify(payload)}\n`)
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

function createStubClaudeClient() {
    return {
        async *streamMessage() {
            const timestamp = new Date().toISOString()
            yield {
                type: 'message_start',
                timestamp,
            }
            yield {
                type: 'content_delta',
                text: 'Stub assistant response.',
            }
            yield {
                type: 'message_done',
                done: true,
            }
        }
    }
}

export function createChatRoutes({ conversationRepo }) {
    const provider = createClaudeProvider({ client: createStubClaudeClient() })

    return [
        {
            method: 'POST',
            path: '/api/conversations/:conversationId/chat/stream',
            handler: async (req, res, params) => {
                requireJsonContentType(req)

                const conversation = conversationRepo.getConversationById(params.conversationId)
                if (!conversation) {
                    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
                    res.end(JSON.stringify({ error: { message: 'Conversation not found' }}))
                    return
                }

                const body = await readJsonBody(req)
                validateBody(body)

                const userMessage = conversationRepo.appendMessage({
                    conversationId: params.conversationId,
                    role: 'user',
                    content: body.content.trim(),
                })

                const assistantMessageId = `msg_assistant_${Date.now()}`
                let assistantText = ''

                res.writeHead(200, {
                    'Content-Type': 'application/x-ndjson; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                })

                for await (const event of provider.streamMessage({
                    conversationId: params.conversationId,
                    messageId: assistantMessageId,
                    messages: [userMessage],
                })) {
                    if (event.type === 'delta') {
                        assistantText += event.chunk ?? ''
                    }
                    writeNdjson(res, event)
                }

                conversationRepo.appendMessage({
                    conversationId: params.conversationId,
                    role: 'assistant',
                    content: assistantText || 'Stub assistant response.',
                })

                res.end()
            },
        },
    ]
}