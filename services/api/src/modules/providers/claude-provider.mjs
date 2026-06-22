export function createClaudeProvider({ client }) {
    return {
        async *streamMessage(input) {
            let timestamp = new Date().toISOString()
            const fallbackConversationId = input.conversationId
            const fallbackMessageId = input.messageId

            for await (const event of client.streamMessage(input)) {
                if (event.type === 'message_start') {
                    timestamp = event.timestamp ?? timestamp
                    yield {
                        type: 'start',
                        conversationId: event.conversationId ?? fallbackConversationId,
                        messageId: event.messageId ?? fallbackMessageId,
                        timestamp,
                    }
                    continue
                }

                if (event.type === 'content_delta') {
                    yield {
                        type: 'delta',
                        conversationId: fallbackConversationId,
                        messageId: fallbackMessageId,
                        chunk: event.text ?? '',
                        timestamp,
                    }
                    continue
                }

                if (event.type === 'message_done') {
                    yield {
                        type: 'done',
                        conversationId: fallbackConversationId,
                        messageId: fallbackMessageId,
                        done: event.done ?? true,
                        timestamp,
                    }
                }
            }
        },
    }
}