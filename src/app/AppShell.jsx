import { useEffect, useState } from 'react'
import ChatView from '../features/chat/ChatView.jsx'
import LibraryView from '../features/library/LibraryView.jsx'
import ConversationSidebar from '../features/conversations/ConversationSidebar.jsx'
import { conversationsApi } from '../lib/conversations-api.js'
import '../styles/app-shell.css'

const VIEWS = {
    CHAT: 'chat',
    LIBRARY: 'library',
}

function AppShell() {
    const [activeView, setActiveView] = useState(VIEWS.CHAT)
    const [conversations, setConversations] = useState([])
    const [activeConversationId, setActiveConversationId] = useState(null)
    const [activeConversation, setActiveConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [draft, setDraft] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [streamingAssistantText, setStreamingAssistantText] = useState('')

    useEffect(() => {
        let cancelled = false

        async function loadConversations() {
            try {
                setLoading(true)
                const payload = await conversationsApi.listConversations()
                if (cancelled) return

                setConversations(payload.items)
                setError(null)

                if (payload.items.length > 0) {
                    setActiveConversationId((current) => current ?? payload.items[0].id)
                }
            } catch (err) {
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        loadConversations()

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!activeConversationId) {
            return
        }

        let cancelled = false

        async function loadConversation() {
            try {
                const payload = await conversationsApi.getConversation(activeConversationId)
                if (cancelled) return

                setActiveConversation(payload.conversation)
                setMessages(payload.messages)
            } catch (err) {
                if (!cancelled) setError(err.message)
            }
        }

        loadConversation()

        return () => {
            cancelled = true
        }
    }, [activeConversationId])

    async function handleCreateConversation() {
        const created = await conversationsApi.createConversation('New Conversation')
        setConversations((current) => [created, ...current])
        setActiveConversationId(created.id)
        setActiveView(VIEWS.CHAT)
    }

    async function handleSendMessage() {
        const content = draft.trim()
        if (!activeConversationId || !content || isSending) return

        const tempUserId = `temp-user_${Date.now()}`
        setDraft('')
        setIsSending(true)
        setStreamingAssistantText('')

        // Immediate UX
        // so we can show ze user instantly

        setMessages((current) => [
            ...current,
            { id: tempUserId, role: 'user', content, createdAt: new Date().toISOString() },
        ])

        try {
            await conversationsApi.sendChatStream(activeConversationId, content, (event) => {
                if (event.type === 'delta') {
                    setStreamingAssistantText((current) => current + (event.chunk ?? ''))
                }
            })

            // Source of truth
            // reloading persisted convo after the stream completes
            const payload = await conversationsApi.getConversation(activeConversationId)
            setActiveConversation(payload.conversation)
            setMessages(payload.messages)
            setStreamingAssistantText('')
        } catch (err) {
            setError(err.message)
            setStreamingAssistantText('')
        } finally {
            setIsSending(false)
        }
    }

    const visibleConversation = activeConversationId ? activeConversation : null
    const visibleMessages = activeConversationId ? messages : []

    return (
        <div className="app-shell">
            <header className="topbar">
                <div className="brand">NEW STREET RESEARCH</div>

                <div className="topbar-controls">
                    <div className="badge">AI ASSISTANT</div>

                    <nav className="primary-nav" aria-label="Primary">
                        <button
                            type="button"
                            className={activeView === VIEWS.CHAT ? 'active' : ''}
                            aria-current={activeView === VIEWS.CHAT ? 'page' : undefined}
                            onClick={() => setActiveView(VIEWS.CHAT)}
                        >
                            Chat
                        </button>
                        <button
                            type="button"
                            className={activeView === VIEWS.LIBRARY ? 'active' : ''}
                            aria-current={activeView === VIEWS.LIBRARY ? 'page' : undefined}
                            onClick={() => setActiveView(VIEWS.LIBRARY)}
                        >
                            Library
                        </button>
                    </nav>
                </div>
            </header>

            <main className="page-content">
                <p className="eyebrow">NEW STREET RESEARCH AI ASSISTANT</p>
                <h1>Research Intelligence Workspace</h1>
                <p className="intro">Ask. Answer. Act.</p>

                {activeView === VIEWS.CHAT ? (
                    <section className="chat-workspace" aria-label="AI chat workspace">
                        <ConversationSidebar
                            conversations={conversations}
                            activeConversationId={activeConversationId}
                            loading={loading}
                            error={error}
                            onSelectConversation={setActiveConversationId}
                            onCreateConversation={handleCreateConversation}
                        />
                        <ChatView 
                            conversation={visibleConversation}
                            messages={visibleMessages} 
                            draft={draft}
                            onDraftChange={setDraft}
                            onSend={handleSendMessage}
                            isSending={isSending}
                            streamingAssistantText={streamingAssistantText}
                        />
                    </section>
                ) : (
                    <LibraryView />
                )}
            </main>
        </div>
    )
}

export default AppShell