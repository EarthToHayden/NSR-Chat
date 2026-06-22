import { sendJson } from '../../server/response.mjs'
import { readJsonBody } from '../../server/request-body.mjs'
import { requireJsonContentType } from '../../middleware/require-json.mjs'

function validateCreateConversationBody(body) {
    if (body.title !== undefined && typeof body.title !== 'string') {
        const err = new Error('title must be a string when provided')
        err.statusCode = 400
        throw err
    }
}

function validateCreateMessageBody(body) {
    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
        const err = new Error('content is required and must be a non-empty string')
        err.statusCode = 400
        throw err
    }

    if (!['user', 'assistant'].includes(body.role)) {
        const err = new Error('role must be one of: user, assistant')
        err.statusCode = 400
        throw err
    }
}

export function createConversationRoutes({ conversationRepo }) {
    return [
        {
            method: 'GET',
            path: '/api/conversations',
            handler: async (_req, res) => {
                const items = conversationRepo.listConversations()
                sendJson(res, 200, { items })
            },
        },
        {
            method: 'POST',
            path: '/api/conversations',
            handler: async (req, res) => {
                requireJsonContentType(req)

                const body = await readJsonBody(req)
                validateCreateConversationBody(body)

                const title = typeof body.title === 'string' && body.title.trim().length > 0
                    ? body.title.trim()
                    : 'Untitled Conversation'

                const conversation = conversationRepo.createConversation({ title })
                sendJson(res, 201, conversation)
            },
        },
        {
            method: 'GET',
            path: '/api/conversations/:conversationId',
            handler: async (req, res, params) => {
                const conversation = conversationRepo.getConversationById(params.conversationId)
                if (!conversation) {
                    sendJson(res, 404, { error: { message: 'Conversation not found'}})
                    return
                }

                const messages = conversationRepo.listMessagesByConversationId(params.conversationId)
                sendJson(res, 200, { conversation, messages })
            },
        },
        {
            method: 'POST',
            path: '/api/conversations/:conversationId/messages',
            handler: async (req, res, params) => {
                requireJsonContentType(req)

                const conversation = conversationRepo.getConversationById(params.conversationId)
                if (!conversation) {
                    sendJson(res, 404, { error: { message: 'Conversation not found' } })
                    return
                }

                const body = await readJsonBody(req)
                validateCreateMessageBody(body)

                const message = conversationRepo.appendMessage({
                    conversationId: params.conversationId,
                    role: body.role,
                    content: body.content.trim(),
                })

                sendJson(res, 201, message)
            },
        },
    ]
}