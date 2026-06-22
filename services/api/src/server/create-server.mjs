import http from 'node:http'
import { createRouter } from './router.mjs'
import { withErrorHandling } from '../middleware/with-error-handling.mjs'
import { createHealthRoutes } from '../modules/health/routes.mjs'
import { createConversationRoutes } from '../modules/conversations/routes.mjs'
import { createChatRoutes } from '../modules/chat/routes.mjs'
import { createAuthRoutes } from '../modules/auth/routes.mjs'
import { createLibraryRoutes } from '../modules/library/routes.mjs'
import { createSqliteClient } from '../persistence/sqlite-client.mjs'
import { runMigrations } from '../persistence/migrations.mjs'
import { createConversationRepository } from '../persistence/conversation-repository.mjs'

export function createServer({ startedAt, dbPath }) {
    const db = createSqliteClient(dbPath)
    runMigrations(db)

    const conversationRepo = createConversationRepository(db)

    const routeDefs = [
        ...createHealthRoutes(startedAt),
        ...createAuthRoutes(),
        ...createLibraryRoutes(),
        ...createConversationRoutes({ conversationRepo }),
        ...createChatRoutes({ conversationRepo }),
    ]

    const safeRoutes = routeDefs.map((route) => ({
        ...route,
        handler: withErrorHandling(route.handler),
    }))

    const routeHandler = createRouter(safeRoutes)
    const server = http.createServer((req, res) => routeHandler(req, res))

    server.on('close', () => {
        db.close()
    })

    return server
}