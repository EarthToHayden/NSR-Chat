function ConversationSidebar({
    conversations,
    activeConversationId,
    loading,
    error,
    onSelectConversation,
    onCreateConversation,
}) {
    return (
        <aside className="chat-sidebar" aria-label="Previous conversations">
            <div className="sidebar-header">
                <h2>Conversations</h2>
                <button type="button" onClick={onCreateConversation}>
                    New
                </button>
            </div>

            {loading ? (
                <p>Loading conversations...</p>
            ) : error ? (
                <p>{error}</p>
            ) : conversations.length === 0 ? (
                <p>No conversations yet.</p>
            ) : (
                <ul>
                    {conversations.map((conversation) => (
                        <li key={conversation.id}>
                            <button
                                type="button"
                                className={conversation.id === activeConversationId ? 'active' : ''}
                                aria-current={conversation.id === activeConversationId ? 'page' : undefined}
                                onClick={() => onSelectConversation(conversation.id)}
                            >
                                {conversation.title}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    )
}

export default ConversationSidebar