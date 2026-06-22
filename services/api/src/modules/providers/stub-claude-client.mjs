// In-process stub client. Used as the default when no API key is configured,
// which keeps tests and key-less local dev fully functional. Yields the same
// raw event shape (message_start / content_delta / message_done) that the real
// client will, so the normalization layer treats both identically.

export function createStubClaudeClient() {
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
        },
    }
}