# Actionable Checklist: NSR AI Chat Platform Foundation

## Execution Mode
- [x] Manual-first mode active: user implements all foundation code directly.
- [x] AI is limited to guidance, review, and troubleshooting unless explicit opt-in to AI-authored code is given.

## Phase 1: Foundations and Boundaries
- [x] Task 1: Establish workspace structure for frontend, API, retrieval stub, and shared contracts
  - Acceptance: Package boundaries, baseline scripts, and feature-based frontend folders exist; frontend still runs.
  - Verify: Manual directory check, npm run dev, npm run build.
  - Files: package.json, src/app/, src/components/, src/features/, src/lib/, src/styles/, services/api/, services/retrieval/, shared/contracts/, docs/

- [x] Task 2: Define API and domain contracts before endpoint implementation
  - Acceptance: Conversation/message DTOs and streaming event schema are defined and reusable.
  - Verify: Contract type check and manual schema review.
  - Files: shared/contracts/, docs/

- [x] Task 3: Build routing shell with Design B preserved and Library nav item visible
  - Acceptance: Chat and Library routes exist; Library placeholder is visible in nav; new shell uses the target frontend structure.
  - Verify: Manual UI route checks and frontend build.
  - Files: src/app/, src/components/, src/features/chat/, src/features/conversations/, src/features/library/, src/styles/, src/main.jsx

## Checkpoint A
- [x] Human review of structure and architecture boundaries.
- [x] Manual-first execution policy confirmed before deep backend implementation.
- [x] Confirm the rebuilt frontend structure is the base foundation, not a throwaway wrapper.

## Phase 2: Persistent Conversation Foundation
- [x] Task 4: Create API service skeleton with health and conversation module wiring
  - Acceptance: API boots locally with health endpoint and baseline middleware.
  - Verify: Manual API health check plus lint/type checks.
  - Files: services/api/src/, services/api/package.json, docs/

- [x] Task 5: Implement SQLite-backed conversation repository and persistence migration hooks
  - Acceptance: Conversation/message persistence works through repository abstraction.
  - Verify: Repository unit tests and persistence integration test.
  - Files: services/api/src/modules/conversations/, services/api/src/persistence/, services/api/tests/

- [x] Task 6: Connect frontend conversations list and history detail to API
  - Acceptance: User can create, list, and reopen persisted conversations.
  - Verify: UI integration tests and manual browser reload check.
  - Files: src/features/conversations/, src/features/chat/, src/app/AppShell.jsx, tests/

## Checkpoint B
- [x] End-to-end persistence flow verified.
- [x] Human architecture review before streaming implementation.
- [x] Confirm manual implementation ownership remains active for Phase 3.

## Phase 3: Streaming Chat and Provider Adapter
- [x] Task 7: Define provider interface and implement Claude streaming adapter
  - Acceptance: Provider abstraction works with normalized Claude stream events.
  - Verify: Contract tests and stream-event ordering tests.
  - Files: services/api/src/modules/providers/, shared/contracts/, services/api/tests/

- [x] Task 8: Implement streaming chat endpoint and frontend streaming renderer
  - Acceptance: User message persists, assistant response streams incrementally, final message persists.
  - Verify: Streaming integration tests and manual UI stream check.
  - Files: services/api/src/modules/chat/, src/features/chat/, src/features/conversations/, tests/

## Checkpoint C
- [x] Core chat path verified: create conversation -> stream response -> reopen history.
- [x] Human review of architecture-critical implementation.
- [x] Confirm manual implementation ownership remains active for Phase 4.

## Phase 4: Hardening and Completion
- [x] Task 9: Add auth/search extension seams and explicit not-implemented behavior
  - Acceptance: Auth and library-search seams exist without full feature implementation.
  - Verify: Manual route/API checks plus lint/type checks.
  - Files: services/api/src/modules/auth/, services/api/src/modules/library/, src/features/library/, shared/contracts/

- [x] Task 10: Build final verification matrix and developer docs
  - Acceptance: All spec acceptance criteria mapped to tests/manual checks; commands documented.
  - Verify: npm test, npm run lint, npm run build, manual docs review.
  - Files: README.md, docs/, tests/, package.json

## Complete Gate
- [x] All checkpoints passed.
- [X] Human sign-off before next phase (auth, search, ingestion).
- [x] Manual-first implementation objective satisfied for initial foundation phase.

---

# Actionable Checklist: Phase 2 — Claude API Live Integration

## Execution Mode (Phase 2)
- [ ] Manual ownership preserved: owner types in every change by hand.
- [ ] AI authors changes as small, file-by-file, typeable blocks with
      explanations (explicit scoped opt-in to AI-authored code for this phase).
- [ ] AI edits/adds no implementation files — only planning/spec docs.

## Phase 5: Configuration and Secrets
- [x] Task 11: Add Claude + limiter configuration and secret handling
  - Acceptance: env exposes all Claude/limiter/retry/identity settings (default
    model `claude-opus-4-8`, thinking off, no secret defaults); `.env.example`
    documents them; `.env` git-ignored.
  - Verify: `npm test` passes; `git status` shows `.env` ignored, `.env.example` tracked.
  - Files: services/api/src/config/env.mjs, services/api/.env.example, .gitignore

## Checkpoint E
- [ ] Human review of config surface and secret handling.
- [ ] Key-absent confirmed as a safe default, not an error.

## Phase 6: Real Claude Streaming
- [x] Task 12: Add SDK dependency, extract stub client, add provider selector
  - Acceptance: `@anthropic-ai/sdk` installed; stub extracted to its own module;
    selector returns stub when no key, real provider when key present.
  - Verify: unit test for selector; `npm test` passes.
  - Files: services/api/package.json, services/api/src/modules/providers/stub-claude-client.mjs, services/api/src/modules/providers/create-chat-provider.mjs, services/api/tests/unit/

- [x] Task 13a: Anthropic client core — mapping, streaming, event translation
  - Acceptance: maps messages + system prompt (`system`, not a message); text
    deltas -> `content_delta`; non-text (thinking) not surfaced;
    refusal/non-retryable -> throw; SDK `maxRetries: 0`. No retry logic yet.
  - Verify: unit tests with injected fake SDK (mapping, events, refusal->throw);
    `npm test` passes.
  - Files: services/api/src/modules/providers/anthropic-client.mjs, services/api/tests/unit/

- [x] Task 13b: Anthropic client resilience — retry/backoff and abort
  - Acceptance: bounded pre-stream exponential backoff on 429/5xx/overload up to
    `claudeRetryMaxAttempts` from `claudeRetryBaseMs` (honors `Retry-After`); no
    retry after first token; respects AbortSignal.
  - Verify: unit tests with injected fake SDK (retry-then-success,
    no-retry-after-token, abort); `npm test` passes.
  - Files: services/api/src/modules/providers/anthropic-client.mjs, services/api/tests/unit/

- [ ] Task 14: Compose provider into server and upgrade the chat route
  - Acceptance: real context-aware streamed response persists; full history sent;
    pre-stream error -> HTTP error, mid-stream -> `error` envelope; disconnect
    aborts upstream; stub path still works with no key.
  - Verify: `npm test` passes (stub integration test unchanged); live smoke;
    disconnect abort observed.
  - Files: services/api/src/server/create-server.mjs, services/api/src/modules/chat/routes.mjs

## Checkpoint F
- [ ] Core path verified against real Claude: create -> stream -> reopen history.
- [ ] Stub fallback intact (tests green with no key).
- [ ] Human review before limiter enforcement.

## Phase 7: Multi-User Safety
- [ ] Task 15: Identity resolution, rate limiter, concurrency limiter
  - Acceptance: identity resolves auth/header/IP (proxy headers only with trust
    flag); rate limiter allows/blocks/resets; concurrency limiter
    acquires/releases/rejects over cap; swappable store interface.
  - Verify: unit tests for all three; `npm test` passes.
  - Files: services/api/src/lib/resolve-user-key.mjs, services/api/src/lib/rate-limiter.mjs, services/api/src/lib/concurrency-limiter.mjs, services/api/tests/unit/

- [ ] Task 16: Enforce limits in the chat route + rate-limit middleware
  - Acceptance: over-cap -> 429 (no upstream call); over-rate -> 429 +
    `Retry-After`; slot released in `finally`; limits key on resolved identity.
  - Verify: integration tests for both 429 cases; manual rapid-request check;
    `npm test` passes.
  - Files: services/api/src/middleware/rate-limit.mjs, services/api/src/modules/chat/routes.mjs, services/api/src/server/create-server.mjs, services/api/tests/integration/

## Checkpoint G
- [ ] Rate limit + concurrency cap verified end to end.
- [ ] Human review of limiter design and in-memory/per-instance caveat (Redis later).

## Phase 8: Verification and Docs
- [ ] Task 17: Integration tests, docs, and verification matrix
  - Acceptance: every Phase-2 acceptance criterion mapped to test/manual check;
    README/docs cover `.env` + SDK install + limiter env; matrix updated.
  - Verify: `npm test`, `npm run lint`, `npm run build` pass; docs review.
  - Files: README.md, docs/VERIFICATION_MATRIX.md, docs/DEVELOPER.md, services/api/tests/integration/

## Phase 2 Complete Gate
- [ ] All Phase-2 checkpoints passed.
- [ ] Human sign-off.
- [ ] Deferred items logged (multi-instance shared store, surfacing thinking,
      auth-based identity once magic-link lands).
