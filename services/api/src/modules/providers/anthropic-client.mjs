import Anthropic from '@anthropic-ai/sdk'

// Maps our stored messages (which carry extra fields like id/createdAt) down to
// the minimal { role, content } shape the Messages API expects. The system
// prompt is sent separately via `system`, never as a message.

function toAnthropicMessages(messages) {
    return (messages ?? []).map((message) => ({
        role: message.role,
        content: message.content,
    }))
}

export function createAnthropicClient({
    apiKey,
    model,
    maxTokens,
    systemPrompt,
    thinking = 'off',
    // Injectable for testing. Default is a real SDK client with retries disabled:
    // retry/backoff is owned by this module, not the SDK, so the
    // behavior lives in exactly
    anthropic = new Anthropic({ apiKey, maxRetries: 0}),
} = {}) {
    return {
        async *streamMessage({ messages }) {
            const params = {
                model,
                max_tokens: maxTokens,
                system: systemPrompt,
                messages: toAnthropicMessages(messages),
            }
            if (thinking == 'adaptive') {
                params.thinking = { type: 'adaptive'}
            }

            const stream = anthropic.messages.stream(params)

            // Translate the SDK's raw stream events into our internal event shape.
            // We map `message_start` from the stream itself (rather than emitting
            // it up front) so a failure before the first event throws WITHOUT
            // having emitted anything. This lets the route return a real HTTP error
            // instead of a half-open stream 
            for await (const event of stream) {
                if (event.type === 'message_start') {
                    yield { type: 'message_start' }
                    continue
                }

                if (
                    event.type === 'content_block_delta' &&
                    event.delta?.type === 'text_delta'
                ) {
                    yield { type: 'content_delta', text: event.delta.text }
                    continue
                }

                // Safety classifiers / model declined. Surface as an error rather
                // than returning an empty or partial "success".
                if (
                    event.type === 'message_delta' &&
                    event.delta?.stop_reason === 'refusal'
                ) {
                    const error = new Error('Claude declined to respond to this request.')
                    throw error
                }
            } 
            
            yield { type: 'message_done', done: true }
        },
    }
}