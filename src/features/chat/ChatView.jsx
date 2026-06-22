function ChatView({ 
    conversation, 
    messages,
    draft,
    onDraftChange,
    onSend,
    isSending,
    streamingAssistantText
}) {
    const canSend = Boolean(conversation && draft.trim().length > 0 && !isSending)

    function handleKeyDown(event) {
        if (event.key == 'Enter' && !event.shiftKey) {
            event.preventDefault()
            onSend()
        }
    }

    return (
        <div className="chat-panel">
            <div className="chat-messages">
                {conversation ? (
                    <>
                        <h2>{conversation.title}</h2>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={message.role === 'user' ? 'msg msg-user' : 'msg msg-ai'}
                            >
                                {message.content}
                            </div>
                        ))}

                        {streamingAssistantText ? (
                            <div className="msg msg-ai">{streamingAssistantText}</div>
                        ) : null}
                    </>
                ) : (
                    <p>Select a conversation or create a new one to view history.</p>
                )}
            </div>

            <div className="chat-box" role="region" aria-label="AI chat input">
                <textarea
                    placeholder="Message sending comes in Task 8."
                    rows="1"
                    value={draft}
                    onChange={(event) => onDraftChange(event.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!conversation || isSending}
                />
                <button type="button" disabled={!canSend} onClick={onSend}>
                    {isSending ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    )
}

export default ChatView