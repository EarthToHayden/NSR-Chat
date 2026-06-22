import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { createSqliteClient } from '../../src/persistence/sqlite-client.mjs'
import { runMigrations } from '../../src/persistence/migrations.mjs'
import { createConversationRepository } from '../../src/persistence/conversation-repository.mjs'

function setupRepo() {
    const dir = mkdtempSync(join(tmpdir(), 'nsr-api-unit-'))
    const dbPath = join(dir, 'unit.sqlite')

    const db = createSqliteClient(dbPath)
    runMigrations(db)

    const repo = createConversationRepository(db)

    return {
        repo,
        cleanup() {
            db.close()
            rmSync(dir, { recursive: true, force: true })
        },
    }
}

test('conversation repository create/list/get works', () => {
    const { repo, cleanup } = setupRepo()
    try {
        const created = repo.createConversation({ title: 'Repo Test' })

        const listed = repo.listConversations()
        assert.equal(listed.length, 1)
        assert.equal(listed[0].id, created.id)
        assert.equal(listed[0].title, 'Repo Test')

        const fetched = repo.getConversationById(created.id)
        assert.equal(fetched.id, created.id)
        assert.equal(fetched.title, 'Repo Test')
    } finally {
        cleanup()
    }
})

test('message persistence is ordered and timestamped', () => {
    const { repo, cleanup } = setupRepo()
    try {
        const conversation = repo.createConversation({ title: 'Message Order Test' })

        repo.appendMessage({
            conversationId: conversation.id,
            role: 'user',
            content: 'First message',
        })

        repo.appendMessage({
            conversationId: conversation.id,
            role: 'assistant',
            content: 'Second message',
        })

        const messages = repo.listMessagesByConversationId(conversation.id)
        assert.equal(messages.length, 2)
        assert.equal(messages[0].content, 'First message')
        assert.equal(messages[1].content, 'Second message')
        assert.ok(messages[0].createdAt)
        assert.ok(messages[1].createdAt)
    } finally {
        cleanup()
    }
})