import { loadEnv } from './config/env.mjs'
import { createServer } from './server/create-server.mjs'

const env = loadEnv()
const startedAt = Date.now()
const server = createServer({
    startedAt,
    dbPath: env.dbPath,
    claude: {
        apiKey: env.anthropicApiKey,
        model: env.claudeModel,
        maxTokens: env.claudeMaxTokens,
        systemPrompt: env.claudeSystemPrompt,
        thinking: env.claudeThinking,
        retryMaxAttempts: env.claudeRetryMaxAttempts,
        retryBaseMs: env.claudeRetryBaseMs,
    },
})

server.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`)
})

function shutdown(signal) {
    console.log(`[api] recieved ${signal}, shutting down...`)
    server.close(() => {
        console.log('[api] server closed')
        process.exit(0)
    })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))