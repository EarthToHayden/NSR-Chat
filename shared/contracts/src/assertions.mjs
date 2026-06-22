import { MESSAGE_ROLES } from './conversation-contracts.mjs'
import { STREAM_EVENT_TYPES } from './stream-contracts.mjs'

function assertNonEmptyString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(fieldName + ' must be a non-empty string')
    }
}

export function assertConversationId(value) {
    assertNonEmptyString(value, 'conversationId')
}

export function assertMessageId(value) {
    assertNonEmptyString(value, 'messageId')
}

export function assertRole(value) {
    if (!MESSAGE_ROLES.includes(value)) {
        throw new Error('role must be one of: ' + MESSAGE_ROLES.join(','))
    }
}

export function assertStreamEventType(value) {
    if (!STREAM_EVENT_TYPES.includes(value)) {
        throw new Error(
            'stream event type must be one of: ' + STREAM_EVENT_TYPES.join(', ')
        )
    }
}

export function assertTimestamp(value) {
    assertNonEmptyString(value, 'timestamp')
    const parsed = Date.parse(value)
    if (Number.isNaN(parsed)) {
        throw new Error('timestamp must be a valid ISO datetime string')
    }
}