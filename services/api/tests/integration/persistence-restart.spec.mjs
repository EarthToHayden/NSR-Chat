import test from 'node:test'
import assert from 'node:assert'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { createSqliteClient } from '../../src/persistence/sqlite-client.mjs'
import { runMigrations } from '../../src/persistence/migrations.mjs'
import { createConversationRepository } from '../../src/persistence/conversation-repository.mjs'

test('conversation data persists across repository instances', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nsr-api-int-'))
    const dbPath = join(dir, 'int.sqlite')

    try {
        {
            const db = createSqliteClient(dbPath)
            runMigrations(db)
            const repo = createConversationRepository(db)

            const conversation = repo.createConversation({ title: 'Persistent Conversation' })
            repo.appendMessage({
                conversationId: conversation.id,
                role: 'user',
                content: 'Persist me',
            })

            db.close()
        }
        
        {
            const db = createSqliteClient(dbPath)
            runMigrations(db)
            const repo = createConversationRepository(db)

            const conversations = repo.listConversations()
            assert.equal(conversations.length, 1)
            assert.equal(conversations[0].title, 'Persistent Conversation')

            const messages = repo.listMessagesByConversationId(conversations[0].id)
            assert.equal(messages.length, 1)
            assert.equal(messages[0].content, 'Persist me')

            db.close()
        }
    } finally {
        rmSync(dir, {
            recursive: true,
            force: true,
            maxRetries: 10,
            retryDelay: 50,
        })
    }
})