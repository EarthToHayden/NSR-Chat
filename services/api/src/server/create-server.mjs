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
import { createChatProvider } from '../modules/providers/create-chat-provider.mjs'
import { createAnthropicClient } from '../modules/providers/anthropic-client.mjs'

export function createServer({ startedAt, dbPath, claude = {} } = {}) {
    const db = createSqliteClient(dbPath)
    runMigrations(db)

    const conversationRepo = createConversationRepository(db)

    // Composition root: pick the real Claude client when a key is configured
    // or else the stub. Routes recieve a ready for use provider
    const chatProvider = createChatProvider({
        apiKey: claude.apiKey,
        createRealClient: createAnthropicClient,
        realClientConfig: {
            apiKey: claude.apiKey,
            model: claude.model,
            maxTokens: claude.maxTokens,
            systemPrompt: claude.systemPrompt,
            thinking: claude.thinking,
            retryMaxAttempts: claude.retryMaxAttempts,
            retryBaseMs: claude.retryBaseMs,
        },
    })

    const routeDefs = [
        ...createHealthRoutes(startedAt),
        ...createAuthRoutes(),
        ...createLibraryRoutes(),
        ...createConversationRoutes({ conversationRepo }),
        ...createChatRoutes({ conversationRepo, provider: chatProvider }),
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