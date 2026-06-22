import { randomUUID } from 'node:crypto'

function mapConversation(row) {
    if (!row) return null

    return {
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

function mapMessage(row) {
    if (!row) return null
    return {
        id: row.id,
        conversationId: row.conversation_id,
        role: row.role,
        content: row.content,
        createdAt: row.created_at,
    }
}

export function createConversationRepository(db) {

    const insertConversation = db.prepare(`
        INSERT INTO conversations (id, title, created_at, updated_at)
        VALUES (?, ?, ?, ?)
    `)

    const listConversationsStmt = db.prepare(`
        SELECT id, title, created_at, updated_at
        FROM conversations
        ORDER BY created_at DESC
    `)

    const getConversationByIdStmt = db.prepare(`
        SELECT id, title, created_at, updated_at
        FROM conversations
        WHERE id = ?
        LIMIT 1
    `)

    const insertMessageStmt = db.prepare(`
        INSERT INTO messages (id, conversation_id, role, content, created_at)
        VALUES (?, ?, ?, ?, ?)
    `)

    const listMessagesByConversationIdStmt = db.prepare(`
        SELECT id, conversation_id, role, content, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC, rowid ASC
    `)

    const updateConversationUpdatedAtStmt = db.prepare(`
        UPDATE conversations
        SET updated_at = ?
        WHERE id = ?    
    `)

    return {
        createConversation({ title}) {
            const now = new Date().toISOString()
            const id = `conv_${randomUUID()}`

            insertConversation.run(id, title, now, now)

            return {
                id,
                title,
                createdAt: now,
                updatedAt: now,
            }
        },

        listConversations() {
            const rows = listConversationsStmt.all()
            return rows.map(mapConversation)
        },

        getConversationById(conversationId) {
            const row = getConversationByIdStmt.get(conversationId)
            return mapConversation(row)
        },

        appendMessage({ conversationId, role, content }) {
            const now = new Date().toISOString()
            const id = `msg_${randomUUID()}`

            insertMessageStmt.run(id, conversationId, role, content, now)
            updateConversationUpdatedAtStmt.run(now, conversationId)

            return {
                id,
                conversationId,
                role,
                content,
                createdAt: now,
            }
        },

        listMessagesByConversationId(conversationId) {
            const rows = listMessagesByConversationIdStmt.all(conversationId)
            return rows.map(mapMessage)
        },
    }
}