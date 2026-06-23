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
import { createRateLimiter } from '../lib/rate-limiter.mjs'
import { createConcurrencyLimiter } from '../lib/concurrency-limiter.mjs'

export function createServer({ startedAt, dbPath, claude = {}, limits = {}, trustProxyHeader = false } = {}) {
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

    // Per-user safety limits. In-memory / per instance - a multi-instance
    // deployment would back these with a shared store (see SPEC extension point)
    const rateLimiter = createRateLimiter({
        max: limits.rateLimitMax ?? 20,
        windowMs: limits.rateLimitWindowMs ?? 60_000,
    })
    const concurrencyLimiter = createConcurrencyLimiter({
        max: limits.maxConcurrentPerUser ?? 3,
    })

    const routeDefs = [
        ...createHealthRoutes(startedAt),
        ...createAuthRoutes(),
        ...createLibraryRoutes(),
        ...createConversationRoutes({ conversationRepo }),
        ...createChatRoutes({
            conversationRepo,
            provider: chatProvider,
            rateLimiter,
            concurrencyLimiter,
            trustProxyHeader,
        }),
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