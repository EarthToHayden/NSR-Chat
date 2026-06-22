export const MESSAGE_ROLES = Object.freeze(['user', 'assistant'])

export const CONVERSATION_STATUSES = Object.freeze(['active', 'archived'])

export const ConversationSchema = Object.freeze({
    id: 'string',
    title: 'string',
    status: 'active|archived',
    createdAt: 'iso-datetime',
    updatedAt: 'iso-datetiime',
})

export const MessageSchema = Object.freeze({
    id: 'string',
    conversationId: 'string',
    role: 'user/assistant',
    content: 'string',
    createdAt: 'iso-datetime',
})

export const CreateConversationRequestSchema = Object.freeze({
    title: 'string (optional)',
})

export const SendMessageRequestSchema = Object.freeze({
    conversationId: 'string',
    content: 'string',
})