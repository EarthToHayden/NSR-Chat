import { createClaudeProvider } from './claude-provider.mjs'
import { createStubClaudeClient } from './stub-claude-client.mjs'

// Selects the upstream client and wraps it in the normalization layer.
// Provider-agnostic: it does not import any concrete real client. The real
// client factory is injected by the composition root, so this module
// has no dependency on Anthropic specifics and is trivially testable.
//
// Real client is used only when BOTH an API key and a factory are provided;
// otherwise it falls back to the stub (safe default: no key -> no spend).

export function createChatProvider({ apiKey, createRealClient, realClientConfig } = {}) {
    const client =
        apiKey && createRealClient
            ? createRealClient(realClientConfig ?? {})
            : createStubClaudeClient()
    return createClaudeProvider({ client })
}