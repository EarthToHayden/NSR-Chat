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
        const message = payload?.error?.message || `Request failed: ${response.status}`
        throw new Error(message)
    }

    return response.json()
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
}