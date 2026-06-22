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

## Foundation Status

Tasks 1–10 complete. Foundation is verified and ready for the next phase.

**Next phase work (not yet implemented):**
- Email magic-link authentication
- Document ingestion and vector search
- EC2 deployment and multi-user hardening

See [SPEC.md](SPEC.md) for full requirements.

