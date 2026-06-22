# Spec: NSR AI Chat Platform Foundation (Design B)

## Status
Confirmed. No implementation code is included in this step.

## Objective
Build the first production-oriented foundation of the NSR AI chat web app using existing Design B visual direction, with:
1. Core chat workflow (send message, receive AI response).
2. Conversation persistence and conversation history browsing.
3. Local-first runtime for development.
4. Architecture intentionally designed for future secure multi-user operation on AWS EC2.
5. Deferred features (email login, file search/filter logic, large-scale ingestion) represented by clean extension points so future implementation is low-friction.

## Target Users
1. Internal NSR users who need conversational access to research insights.
2. Early developer/operator users running the system locally.
3. Future authenticated multi-user teams once hosted on EC2.

## Scope for This Foundation
### In Scope
1. Design B-based chat UI as the product baseline, rebuilt from the ground up using the existing mockup as a visual and interaction reference.
2. Chat session creation and message exchange.
3. Persistent conversation storage through a local backend datastore.
4. Conversation list/history and ability to reopen previous threads.
5. File library area shell and route-level placeholders for future search/filter features.
6. Provider adapter architecture with Claude as the first supported provider.
7. Project structure prepared for multi-language services.

### Out of Scope (Deferred)
1. Email magic-link login implementation.
2. Real document ingestion, indexing, retrieval, and ranking over thousands of files.
3. Production security controls beyond baseline scaffolding.
4. Full AWS deployment automation.
5. Advanced concurrency/threading optimizations.

## Clarified Requirements and Constraints
1. Runtime now: local development execution.
2. Runtime later: EC2 deployment with multiple users and strong security posture.
3. Chat model direction: real AI integration path with provider adapter pattern; Claude first.
4. Storage now: local backend storage (not browser-only storage).
5. Stack direction: mixed-language from day one, but with minimal operational complexity.
6. User preference: all implementation in the initial foundation phase is manual-by-user to maximize familiarity and cognition depth across the entire system.
7. AI role in the initial phase: guidance, planning, design review, code review, debugging assistance, and test strategy support; no direct AI-authored production implementation code unless explicitly requested later.

## Assumptions
1. Existing Design B UX patterns in the current React mockup are accepted as baseline visual language.
2. Local backend persistence should be lightweight and migration-friendly; default assumption is SQLite for local phase.
3. Future object/file storage target is S3 (or equivalent object store).
4. Conversation persistence in this phase is per local environment, not yet enterprise user-scoped.
5. Initial chat responses are streaming by default for first release.

## Tech Stack (Foundation)
1. Frontend: React + Vite, migrated to TypeScript as part of foundation implementation.
2. Backend API (service 1): TypeScript Node service for chat/conversation APIs and orchestration.
3. AI adapter layer (within backend API): provider interface + Claude adapter implementation.
4. Retrieval/file service (service 2, minimal scaffold): Python service boundary with stub endpoints/interfaces for future ingestion/search.
5. Local datastore: SQLite for conversations/messages metadata in local phase.
6. Deployment target design: monolith-first packaging on EC2 for initial production, with modular boundaries enabling future service split.
7. Data migration note: SQLite data is migrated to a future production database (for example PostgreSQL/RDS), while S3 is used for object/file storage rather than as a relational conversation store.

## Architecture Intent
### High-level Components
1. Web client (Design B app shell + chat + conversation history + file library placeholder views).
2. API service (conversation lifecycle, message handling, provider dispatch, future auth hooks).
3. Provider adapters (Claude first, extensible to others without UI-level rewrite).
4. Persistence layer (conversation/message repositories, abstraction to support future PostgreSQL migration).
5. Retrieval boundary (stub now, future document indexing/search service).

### Key Extension Points
1. Auth provider interface and route guards (stub only now).
2. Search/filter query contract for file library API (stub only now).
3. Storage adapter for moving from local disk/SQLite to S3/Postgres-backed infrastructure.
4. Audit and policy middleware hooks for future enterprise security hardening.

## Commands
### Current Repository Commands
1. Dev UI: npm run dev
2. Lint: npm run lint
3. Build: npm run build

### Foundation Command Surface (to be implemented in next phase)
1. Start frontend: npm run dev:web
2. Start backend API: npm run dev:api
3. Start Python retrieval stub: npm run dev:retrieval
4. Start full local stack: npm run dev:all
5. Run unit tests: npm run test:unit
6. Run integration tests: npm run test:integration
7. Run all tests: npm test
8. Type checks: npm run typecheck
9. Lint all: npm run lint
10. Build all: npm run build

## Project Structure (Target)
1. src/app/ -> application shell, routing, providers, and global composition.
2. src/features/chat/ -> chat UI components, state, and view models.
3. src/features/conversations/ -> conversation list, detail, and history navigation.
4. src/features/library/ -> file browser placeholder routes and UI shells.
5. src/components/ -> shared UI primitives used across features.
6. src/lib/ -> shared utilities, adapters, and non-UI helpers.
7. src/styles/ -> design tokens, theme primitives, and app-wide style rules.
8. services/api/ -> TypeScript backend API service.
9. services/api/src/modules/chat/ -> chat endpoints and orchestration.
10. services/api/src/modules/conversations/ -> conversation CRUD/history endpoints.
11. services/api/src/modules/auth/ -> auth stubs/interfaces for future magic-link flow.
12. services/api/src/modules/providers/ -> provider abstraction and Claude adapter.
13. services/retrieval/ -> Python service scaffold for future indexing/search.
14. shared/contracts/ -> API/request/response schemas and type contracts.
15. tests/unit/ -> unit tests (frontend/backend by package boundary).
16. tests/integration/ -> API and persistence integration tests.
17. docs/ -> architecture notes, security decisions, migration notes.

## Code Style
1. Prefer TypeScript strict mode for frontend and API boundaries.
2. Keep modules small and domain-focused.
3. Use explicit interfaces for adapters and repositories.
4. Separate transport models from domain models.
5. Validate all API inputs at boundaries.

### Example Style Snippet
```ts
export interface ChatProvider {
  sendMessage(input: ProviderMessageInput): Promise<ProviderMessageOutput>
}

export class ClaudeProvider implements ChatProvider {
  async sendMessage(input: ProviderMessageInput): Promise<ProviderMessageOutput> {
    // Provider-specific implementation stays behind this boundary.
    return { text: 'stub', usage: { inputTokens: 0, outputTokens: 0 } }
  }
}
```

## Testing Strategy
1. Unit-first for view models, provider adapters, repositories, and validation logic.
2. Integration tests for conversation APIs and persistence behavior.
3. Contract tests for provider adapter interface compliance.
4. UI tests for Design B chat flows and conversation history interactions.
5. Minimal end-to-end smoke test for local stack startup and basic chat round trip.

### Coverage Targets
1. Core domain modules (chat orchestration, persistence): >= 85% line coverage.
2. UI foundation modules: >= 70% line coverage.
3. Critical path tests required before merge: create conversation, send message, reopen history.

## Boundaries
### Always
1. Preserve Design B intent while converting mockup into functional product UI.
2. Keep provider calls behind adapter interfaces.
3. Keep persistence behind repository abstractions.
4. Validate and sanitize user input at API boundaries.
5. Run lint, type checks, and relevant tests before merge.
6. Maintain manual-first implementation ownership for all foundation tasks.

### Ask First
1. Adding new runtime dependencies in backend or retrieval service.
2. Database engine changes (SQLite to Postgres) during foundation phase.
3. Introducing background workers, queues, or threaded processing.
4. Modifying auth approach from planned email magic-link direction.
5. Any shift from manual-first implementation to AI-generated implementation in any module.

### Never
1. Commit secrets, API keys, or credentials.
2. Implement direct provider calls from frontend.
3. Hardcode security-sensitive behavior as a temporary shortcut.
4. Remove or disable failing tests to force a passing pipeline.
5. Assume AI should auto-implement foundation tasks without explicit user direction.

## Acceptance Criteria
1. Design B is the default UI foundation and supports desktop/mobile layouts.
2. User can create a new conversation and send a chat message.
3. AI response is returned through backend provider adapter path with streaming output to the chat UI.
4. Conversation and messages are persisted in local backend datastore.
5. User can view prior conversations and reopen one to review message history.
6. File library route exists with placeholder/filter shell UI, clear not-yet-implemented states, and is visible in main navigation.
7. Auth extension points exist in code structure without implementing login flow.
8. Provider abstraction supports Claude as first adapter without coupling UI to provider specifics.
9. Local stack can run end-to-end with documented commands.
10. Architecture and module boundaries remain compatible with future EC2 deployment and multi-user hardening.
11. Initial foundation implementation is completed manually by the user, with AI used only as guide/reviewer unless the user explicitly opts in to AI-authored code.

## Security and Scalability Baseline (Foundation-Level)
1. Baseline input validation, output encoding, and server-side error handling.
2. Configuration via environment variables and secret placeholders only.
3. Structured logs with no sensitive payload leakage.
4. Clear threat-surface notes for deferred hardening items (rate limiting, session controls, audit trails).

## Repo Convention Check and Conflicts
1. Conflict: repository currently uses a flat JavaScript root app, while this spec targets a feature-based app shell with cleaner composition boundaries.
2. Conflict: repository currently has no root npm test command or unified test runner, while project standards require tests after changes.

### Options
1. Preferred: rebuild the frontend into a feature-based shell first, then layer TypeScript migration and unified test scripts in the foundation setup.
2. Alternative: keep the current root `src` layout temporarily and migrate into the target structure only after the chat shell is working.

## Success Criteria
1. Foundation is usable locally for real chat and conversation history.
2. Deferred features are represented by clean extension seams, not ad hoc placeholders.
3. Project layout supports long-term growth and mixed-language services without major rewrites.
4. Team can proceed into implementation with clear milestones and low ambiguity.

## Open Questions
1. None.

## Implementation Gate
Do not begin implementation until this spec is explicitly confirmed.

---

# Spec Addendum: Phase 2 — Claude API Live Integration

## Status
Proposed. Awaiting confirmation. No implementation code in this step.

## 1. Objective
Make the existing chat surface functional against the real Claude API, replacing
the in-process stub client, while preserving every existing contract (NDJSON
stream envelope, persistence behavior, route shapes). The integration must be
modular (provider-swappable), safe for concurrent users on a single shared
server-side API key, protected against runaway usage (rate limiting + per-user
concurrency caps), resilient to transient upstream errors, and secure for
eventual EC2 deployment. File ingestion / retrieval remains out of scope.

### Resolved decisions
1. Transport: official `@anthropic-ai/sdk`, added as the API service's first
   runtime dependency.
2. Model: configurable via `CLAUDE_MODEL`, default `claude-opus-4-8`.
3. Concurrency/safety this phase (all in scope):
   - Stateless per-request usage on one shared key.
   - Abort the upstream Claude call on client disconnect.
   - Per-user concurrency cap on simultaneous in-flight streams.
   - Per-user rate limiting (overrides the base spec's deferred-hardening note
     for rate limiting).
   - Explicit, bounded exponential backoff on retryable errors (429/5xx/overload).

## 2. Key Behaviors
1. The chat stream sends the **full conversation history** to Claude, not just
   the latest user turn, so responses are context-aware across the thread.
2. A configurable system prompt is sent on every request (not stored per message).
3. If `ANTHROPIC_API_KEY` is unset, the service falls back to the existing stub
   client. This keeps the integration test suite and key-less local dev green,
   and is the safe default (no accidental spend, no startup crash).
4. On client disconnect mid-stream, the upstream Claude request is aborted via
   an AbortController so abandoned streams stop consuming tokens.
5. Only assistant **text** deltas are mapped to the existing `delta` envelope.
   Extended thinking is off by default (`CLAUDE_THINKING=off`); surfacing
   thinking to the UI is a documented extension point, not part of this phase.
6. Retry/backoff applies only **before the first streamed token** (connection /
   pre-stream phase). Once streaming has begun, a failure cannot be transparently
   retried (partial output is already sent) and becomes an `error` envelope.

## 3. User Identity, Rate Limiting & Concurrency Caps
1. **Identity resolution** (`resolveUserKey(req)` helper): authenticated user id
   when auth exists (extension point), else a trusted `X-User-Id` header, else
   the client IP. `X-Forwarded-For` is honored only when an explicit
   trusted-proxy flag is set, to prevent identity spoofing.
2. **Per-user concurrency cap**: an in-memory map of identity → in-flight stream
   count. Requests over `CLAUDE_MAX_CONCURRENT_PER_USER` are rejected with HTTP
   429 before any upstream call. The counter decrements on stream completion,
   error, or disconnect (guaranteed via `finally`).
3. **Per-user rate limiting**: fixed-window (or token-bucket) counter keyed on
   identity, `CLAUDE_RATE_LIMIT_MAX` requests per `CLAUDE_RATE_LIMIT_WINDOW_MS`.
   Over-limit requests return 429 with a `Retry-After` header.
4. **Retry/backoff**: the SDK's own retries are disabled (`maxRetries: 0`) so
   behavior is owned in one place; the client retries retryable errors up to
   `CLAUDE_RETRY_MAX_ATTEMPTS` with exponential backoff from `CLAUDE_RETRY_BASE_MS`,
   honoring any `Retry-After` from a 429.
5. Both limiters are **in-memory / per-instance** — correct for single-instance
   now; multi-instance EC2 needs a shared store (e.g. Redis). The limiter
   modules expose a small interface so the backing store can be swapped without
   touching routes. Documented extension point.

## 4. Commands
1. Install SDK (one-time): `npm --prefix services/api install @anthropic-ai/sdk`
2. Configure secrets: copy `services/api/.env.example` to `services/api/.env`
   and set `ANTHROPIC_API_KEY`. `.env` is git-ignored; never committed.
3. Run API with live Claude: `npm run dev:api` (reads `.env`)
4. Run tests (no key needed; exercises stub path): `npm test`
5. Manual smoke: create a conversation, POST to the chat stream endpoint, and
   confirm a real streamed answer is returned and persisted; exceed the cap /
   rate limit and confirm 429s.

## 5. Project Structure (changes)
New files under `services/api/src/modules/providers/`:
1. `anthropic-client.mjs` — `createAnthropicClient({ apiKey, model, maxTokens,
   systemPrompt, thinking, retry })`. Returns `{ async *streamMessage({ messages,
   signal }) }` yielding internal client events (`message_start`,
   `content_delta`, `message_done`). Maps repo messages → Anthropic
   `{role, content}`, applies pre-stream retry/backoff, calls the SDK streaming
   API, maps SDK stream events back, and **throws** typed errors (refusal, API
   error) rather than swallowing them.
2. `stub-claude-client.mjs` — the existing inline stub, extracted verbatim.
3. `create-chat-provider.mjs` — selector: real vs stub client based on presence
   of `apiKey`, wrapped in the existing `createClaudeProvider`.

New files under `services/api/src/middleware/` and `services/api/src/lib/`:
4. `lib/resolve-user-key.mjs` — identity resolution helper (auth → header → IP).
5. `lib/rate-limiter.mjs` — in-memory rate limiter with a swappable store interface.
6. `lib/concurrency-limiter.mjs` — in-memory per-user in-flight counter.
7. `middleware/rate-limit.mjs` — applies the rate limiter; emits 429 + Retry-After.

Touched files:
8. `services/api/src/config/env.mjs` — add `anthropicApiKey`, `claudeModel`,
   `claudeMaxTokens`, `claudeSystemPrompt`, `claudeThinking`,
   `claudeMaxConcurrentPerUser`, `claudeRateLimitMax`, `claudeRateLimitWindowMs`,
   `claudeRetryMaxAttempts`, `claudeRetryBaseMs`, `trustProxyHeader`. No secret
   defaults; key defaults to undefined.
9. `services/api/src/server/create-server.mjs` — build provider + limiters in
   this composition root and inject into `createChatRoutes`.
10. `services/api/src/modules/chat/routes.mjs` — accept injected `provider`,
    `rateLimiter`, `concurrencyLimiter`; resolve user key; enforce rate limit and
    concurrency cap before streaming; load full history via
    `listMessagesByConversationId`; defer the 200 NDJSON header until the first
    stream event so pre-stream errors return a real HTTP status; wire abort on
    disconnect; map thrown errors to an `error` stream envelope; release the
    concurrency slot in `finally`.
11. `services/api/package.json` — `@anthropic-ai/sdk` under `dependencies`.
12. `services/api/.env.example` — documents env vars (no real secrets).
13. `.gitignore` — ensure `services/api/.env` (and `**/.env`) is ignored.

Unchanged on purpose: `claude-provider.mjs` (normalization stays pure), the
stream contract, the persistence schema, and all front-end code.

## 6. Code Style
1. Match existing conventions: ESM `.mjs`, factory functions returning plain
   objects, dependency injection at the `create-server` composition root.
2. Keep the provider/normalization boundary intact — provider stays
   transport-agnostic; error→envelope mapping lives in the route.
3. Limiters expose a minimal interface (`check`/`acquire`/`release`) so the
   in-memory backing store can be replaced without route changes.
4. Config only via environment; no inline secrets, no secrets in logs.
5. Parse model output via the SDK's typed stream events; never raw-string-match.

## 7. Testing Strategy
1. Unit: `anthropic-client` mapping against a fake/injected SDK (message mapping;
   SDK events → internal events; refusal → thrown error; retry/backoff on a
   simulated 429 then success; no retry once streaming started).
2. Unit: rate limiter (allows under limit, blocks over, resets after window) and
   concurrency limiter (acquire/release, rejects over cap, releases on error).
3. Contract: existing `claude-provider` test stays green unchanged.
4. Integration: existing `chat-stream-lifecycle` test stays green via stub
   fallback; add cases for the `error` envelope on a thrown client error, and
   for 429 responses when cap / rate limit is exceeded.
5. Manual smoke (documented): one real round-trip with a live key.

## 8. Security Baseline
1. API key only from environment; `.env` git-ignored; never logged or sent to
   the frontend (frontend→provider call remains forbidden).
2. Single shared server-side key; no per-request mutable shared state, so
   concurrent users cannot leak into each other's streams.
3. Identity keying does not trust client-supplied proxy headers unless the
   trusted-proxy flag is explicitly set.
4. Rate limiting and concurrency caps protect the shared key's quota from a
   single abusive user.
5. Structured logs exclude message content and the key.

## 9. Acceptance Criteria
1. With a valid `ANTHROPIC_API_KEY`, sending a message returns a real,
   context-aware streamed Claude response, persisted as in the current contract.
2. With no key set, the stub path runs and `npm test` passes unchanged.
3. Multiple concurrent users receive independent, non-interleaved streams.
4. Exceeding the per-user concurrency cap or rate limit returns HTTP 429
   (with `Retry-After` for rate limits) without an upstream call.
5. A retryable upstream error before streaming is retried with backoff; a
   non-retryable error or a mid-stream failure surfaces as a clean `error`
   envelope (or proper HTTP error if pre-stream) — never a crash.
6. Disconnecting mid-stream aborts the upstream Claude call and releases the
   concurrency slot.
7. The provider abstraction is unchanged; swapping providers needs no route/UI edits.
8. No secret is committed; key is absent from logs and frontend.

## 10. Boundaries
### Always
1. Keep provider calls behind the adapter/normalization layer.
2. Default to the stub when no key is present.
3. Enforce rate limit + concurrency cap before any upstream call.
4. Abort upstream calls and release the slot on disconnect.
5. Load full thread history for context.

### Ask First
1. Enabling extended thinking by default, or surfacing thinking to the UI.
2. Changing the default model, `max_tokens`, limiter, or retry defaults.
3. Moving limiters to a shared store (Redis) / multi-instance topology.
4. Any new runtime dependency beyond `@anthropic-ai/sdk`.

### Never
1. Call Claude directly from the frontend.
2. Commit `.env` or hardcode the API key.
3. Log message content or the API key.
4. Remove/disable the stub fallback (it is the test and key-less-dev path).
5. Trust client-supplied proxy/identity headers without the explicit trust flag.

## 11. Implementation Gate
Do not begin implementation until this addendum is confirmed. On confirmation,
changes are delivered file-by-file as typeable blocks with explanations, for
manual entry by the codebase owner.
