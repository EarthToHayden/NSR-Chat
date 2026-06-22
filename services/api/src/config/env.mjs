import { fileURLToPath } from 'node:url'

function parsePort(raw, fallback) {
    const port = Number(raw);
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
        return fallback;
    }
    return port;
}

//Positive-integer env parser. Returns the fallback when the value is missing
// non-numeric, or bloew min (so "0", "-5", and "abc" never slip through)

function parseIntEnv(raw, fallback, { min = 1 } = {}) {
    if (raw === undefined) return fallback
    const value = Number(raw)
    if(!Number.isInteger(value) || value < min) return fallback
    return value
}

function parseBool(raw, fallback) {
    if (raw === undefined) return fallback
    return raw === 'true' || raw === '1'
}

const defaultDbPath = fileURLToPath(new URL('../../db/data.sqlite', import.meta.url))

const DEFAULT_SYSTEM_PROMPT = 
    'You are the NSR AI research assistant. Answer accurately and concisely, and be explicit about uncertainty.'

export function loadEnv() {
    return {
        nodeEnv: process.env.NODE_ENV ?? 'development',
        port: parsePort(process.env.PORT, 4100),
        dbPath: process.env.DB_PATH ?? defaultDbPath,

        // ---- Claude provider ----
        // Intentially no default: absence is a valid, safe state
        // (the provider selector falls back to the stub client when this is undefined)
        
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        claudeModel: process.env.CLAUDE_MODEL ?? 'claude-opus-4-8',
        claudeMaxTokens: parseIntEnv(process.env.CLAUDE_MAX_TOKENS, 8192),
        claudeSystemPrompt: process.env.CLAUDE_SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT,
        claudeThinking: process.env.CLAUDE_THINKING ?? 'off', // "off" | "on" | "adaptive"

        // ---- Per-user safety limits ----
        claudeMaxConcurrentPerUser: parseIntEnv(process.env.CLAUDE_MAX_CONCURRENT_PER_USER, 3),
        claudeRateLimitMax: parseIntEnv(process.env.CLAUDE_RATE_LIMIT_MAX, 20),
        claudeRateLimitWindowMs: parseIntEnv(process.env.CLAUDE_RATE_LIMIT_WINDOW_MS, 60000),

        // ---- Upstream resilience ----
        claudeRetryMaxAttempts: parseIntEnv(process.env.CLAUDE_RETRY_MAX_ATTEMPTS, 3),
        claudeRetryBaseMs: parseIntEnv(process.env.CLAUDE_RETRY_BASE_MS, 500),

        // ---- Identity / proxy trust ----
        trustProxyHeader: parseBool(process.env.TRUST_PROXY_HEADER, false),
    }
}