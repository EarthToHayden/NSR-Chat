# NSR AI Chat Platform — Foundation

A local-first, production-oriented chat application built from Design B with streaming responses, persistent conversations, and extensible auth/library placeholders.

## Quick Start

```bash
npm install

# Start frontend (runs at http://localhost:5173)
npm run dev:web

# In a separate terminal, start the API (runs at http://localhost:4100)
npm run dev:api
```

## Connecting Claude

The API calls the **real Claude API** when a key is configured, and falls back to
a built-in **stub** (a canned response) when it isn't — so tests and key-less
local dev always work.

```bash
cp services/api/.env.example services/api/.env
# then set ANTHROPIC_API_KEY=sk-ant-... in services/api/.env
npm run dev:api   # auto-loads services/api/.env
```

Without `ANTHROPIC_API_KEY`, chat still works but returns the stub response.
`.env` is git-ignored — never commit your key. Optional tuning vars (model, max
tokens, system prompt, per-user rate limit + concurrency cap, retry backoff) are
documented in `services/api/.env.example` and `docs/DEVELOPER.md`.

## Verification

Before committing any work, run:

```bash
npm test        # All tests pass
npm run lint    # No lint errors
npm run build   # Build succeeds
```

Full verification matrix: [docs/VERIFICATION_MATRIX.md](docs/VERIFICATION_MATRIX.md)  
Developer workflow and setup: [docs/DEVELOPER.md](docs/DEVELOPER.md)

## Architecture

| Layer | Location | Purpose |
|-------|----------|---------|
| Frontend | `src/` | React + Vite, feature-based shell (Chat, Conversations, Library) |
| API Service | `services/api/` | Node.js HTTP server — conversations, chat streaming, auth/library stubs |
| Persistence | `services/api/src/persistence/` | SQLite via repository abstraction, migration-ready |
| Shared Contracts | `shared/contracts/` | DTO schemas and assertions shared across services |
| Retrieval Service | `services/retrieval/` | Python stub for future document indexing/search |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev:web` | Start frontend dev server |
| `npm run dev:api` | Start API service |
| `npm run dev:all` | Start all services (web only currently) |
| `npm test` | Run all tests (contracts + API) |
| `npm run build` | Build all packages |
| `npm run lint` | Lint code |
| `npm run preview` | Preview built frontend |

## Status

**Phase 1 (foundation)** and **Phase 2 (live Claude integration)** complete:
- Real Claude API streaming behind a provider abstraction, with stub fallback.
- Full conversation history sent for context; user + assistant messages persisted.
- Per-user rate limiting and concurrency caps, bounded retry/backoff, and
  abort-on-disconnect.

**Next phase work (not yet implemented):**
- Email magic-link authentication (then per-user limits key on user id, not IP)
- Document ingestion and vector search
- EC2 deployment with a shared limiter store (Redis) for multi-instance

See [SPEC.md](SPEC.md) for full requirements.

