import test from 'node:test'
import assert from 'node:assert/strict'
import { loadEnv } from '../../src/config/env.mjs'

const CLAUDE_KEYS = [
    'ANTHROPIC_API_KEY',
    'CLAUDE_MODEL',
    'CLAUDE_MAX_TOKENS',
    'CLAUDE_SYSTEM_PROMPT',
    'CLAUDE_THINKING',
    'CLAUDE_MAX_CONCURRENT_PER_USER',
    'CLAUDE_RATE_LIMIT_MAX',
    'CLAUDE_RATE_LIMIT_WINDOW_MS',
    'CLAUDE_RETRY_MAX_ATTEMPTS',
    'CLAUDE_RETRY_BASE_MS',
    'TRUST_PROXY_HEADER',
]

// Clear the Claude-related vars, apply overrides, call loadEnv, then restore.
// Keeps these tests independent of whatever is in the real environment / .env.
function withEnv(overrides, fn) {
    const saved = {}
    for (const key of CLAUDE_KEYS) {
        saved[key] = process.env[key]
        delete process.env[key]
    }
    Object.assign(process.env, overrides)
    try {
        return fn()
    } finally {
        for (const key of CLAUDE_KEYS) {
            if (saved[key] === undefined) delete process.env[key]
            else process.env[key] = saved[key]
        }
    }
}

test('loadEnv: Claude config defaults when env is unset', () => {
    const env = withEnv({}, loadEnv)

    assert.equal(env.anthropicApiKey, undefined) // no secret default
    assert.equal(env.claudeModel, 'claude-opus-4-8')
    assert.equal(env.claudeMaxTokens, 8192)
    assert.equal(env.claudeThinking, 'off')
    assert.equal(env.claudeMaxConcurrentPerUser, 3)
    assert.equal(env.claudeRateLimitMax, 20)
    assert.equal(env.claudeRateLimitWindowMs, 60000)
    assert.equal(env.claudeRetryMaxAttempts, 3)
    assert.equal(env.claudeRetryBaseMs, 500)
    assert.equal(env.trustProxyHeader, false)
    assert.equal(typeof env.claudeSystemPrompt, 'string')
})

test('loadEnv: Claude config is read from the environment', () => {
    const env = withEnv(
        {
            ANTHROPIC_API_KEY: 'sk-ant-test',
            CLAUDE_MODEL: 'claude-sonnet-4-6',
            CLAUDE_MAX_TOKENS: '4096',
            CLAUDE_THINKING: 'adaptive',
            CLAUDE_MAX_CONCURRENT_PER_USER: '5',
            CLAUDE_RATE_LIMIT_MAX: '100',
            CLAUDE_RATE_LIMIT_WINDOW_MS: '30000',
            CLAUDE_RETRY_MAX_ATTEMPTS: '4',
            CLAUDE_RETRY_BASE_MS: '250',
            TRUST_PROXY_HEADER: 'true',
        },
        loadEnv
    )

    assert.equal(env.anthropicApiKey, 'sk-ant-test')
    assert.equal(env.claudeModel, 'claude-sonnet-4-6')
    assert.equal(env.claudeMaxTokens, 4096)
    assert.equal(env.claudeThinking, 'adaptive')
    assert.equal(env.claudeMaxConcurrentPerUser, 5)
    assert.equal(env.claudeRateLimitMax, 100)
    assert.equal(env.claudeRateLimitWindowMs, 30000)
    assert.equal(env.claudeRetryMaxAttempts, 4)
    assert.equal(env.claudeRetryBaseMs, 250)
    assert.equal(env.trustProxyHeader, true)
})

test('loadEnv: invalid integers fall back to defaults', () => {
    const env = withEnv(
        { CLAUDE_MAX_TOKENS: 'not-a-number', CLAUDE_RETRY_BASE_MS: '-5' },
        loadEnv
    )
    assert.equal(env.claudeMaxTokens, 8192)
    assert.equal(env.claudeRetryBaseMs, 500)
})
