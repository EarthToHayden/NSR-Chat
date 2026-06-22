export const STREAM_EVENT_TYPES = Object.freeze(['start', 'delta', 'done', 'error'])

export const StreamEventEnvelopeSchema = Object.freeze({
    type: 'start|delta|done|error',
    conversationId: 'string',
    messageId: 'string',
    chunk: 'string (optional; used by delta)',
    done: 'boolean (optional; used by done)',
    error: 'string (optional; used by error)',
    timestamp: 'iso-datetime',
})