async function requestJson(path, options = {}) {
    const response = await fetch(path, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers ?? {}),
        },
        ...options,
    })

    if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error?.message ?? `Request failed: ${response.status}`
        throw new Error(message)
    }

    return response.json()
}

async function sendChatStream(conversationId, content, onEvent) {
    const response = await fetch(`/api/conversations/${conversationId}/chat/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            role: 'user',
            content,
        }),
    })

    if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error?.message ?? `Request failed: ${response.status}`
        throw new Error(message)
    }

    if (!response.body) {
        throw new Error('Streaming response body is not available')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            const event = JSON.parse(trimmed)
            onEvent?.(event)
        }
    }

    if (buffer.trim().length > 0) {
        const event = JSON.parse(buffer.trim())
        onEvent?.(event)
    }
}

export const conversationsApi = {
    listConversations() {
        return requestJson('/api/conversations')
    },

    createConversation(title) {
        return requestJson('/api/conversations', {
            method: 'POST',
            body: JSON.stringify({ title }),
        })
    },

    getConversation(conversationId) {
        return requestJson(`/api/conversations/${conversationId}`)
    },

    sendChatStream(conversationId, content, onEvent) {
        return sendChatStream(conversationId, content, onEvent)
    },
}