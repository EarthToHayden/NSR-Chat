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

// Retryable = transient upstream conditions for rate limits (429) and server errors
// (5xx, incl. 529 overloaded). 4xx (bad request, auth) and refusals are
// permanent. Retrying just wastes time and money
function isRetryableError(error) {
    const status = error?.status
    return status === 429 || (typeof status === 'number' && status >= 500)
}

// Prefer the server's Retry-After (seconds) when present, otherwise exponential
// backoff from the configured base: baseMs, 2*baseMs, 4*baseMs, ...
function retryDelayMs(attempt, baseMs, error) {
    const retryAfter = Number(error?.headers?.['retry-after'])
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
        return retryAfter * 1000
    }
    return baseMs * 2 ** (attempt - 1)
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve,ms))

export function createAnthropicClient({
    apiKey,
    model,
    maxTokens,
    systemPrompt,
    thinking = 'off',
    retryMaxAttempts = 3,
    retryBaseMs = 500,
    // Injectable for testing. Default is a real SDK client with retries disabled:
    // retry/backoff is owned by this module, not the SDK, so the
    // behavior lives in exactly
    anthropic = new Anthropic({ apiKey, maxRetries: 0}),
    sleep = defaultSleep,
} = {}) {
    return {
        async *streamMessage({ messages, signal }) {
            const params = {
                model,
                max_tokens: maxTokens,
                system: systemPrompt,
                messages: toAnthropicMessages(messages),
            }
            if (thinking == 'adaptive') {
                params.thinking = { type: 'adaptive'}
            }

            const requestOptions = signal ? { signal } : undefined
            // Include requestOptions in the SDK call

            let attempt = 0
            while (true) {
                attempt+=1
                // The moment we hand the route its first event, the HTTP response
                // is committed. A retry past this point could duplicate output.
                let emitted = false

                try {
                    const stream = anthropic.messages.stream(params, requestOptions)

                    // Translate the SDK's raw stream events into our internal event shape.
                    // We map `message_start` from the stream itself (rather than emitting
                    // it up front) so a failure before the first event throws WITHOUT
                    // having emitted anything. This lets the route return a real HTTP error
                    // instead of a half-open stream 
                    for await (const event of stream) {
                        if (event.type === 'message_start') {
                            emitted = true
                            yield { type: 'message_start' }
                            continue
                        }

                        if (
                            event.type === 'content_block_delta' &&
                            event.delta?.type === 'text_delta'
                        ) {
                            emitted = true
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
                            error.code = 'refusal'
                            throw error
                        }
                    } 
                    
                    yield { type: 'message_done', done: true }
                    return

                } catch (error) {
                    // Abort always wins, never retry a cancelled request
                    if (signal?.aborted) throw error

                    // Can't rety once the response has started streaming
                    if (emitted) throw error

                    // Permanent failure, or no attempt left. Give up
                    if (!isRetryableError(error) || attempt >= retryMaxAttempts) throw error

                    await sleep(retryDelayMs(attempt, retryBaseMs, error))
                    //loop continues -> next attempt
                }
            }
        },
    }
}