# Developer Workflow: NSR AI Chat Platform Foundation

## Manual-First Implementation Mode

This foundation was built in **manual-first mode**: every line of code was written by the user, with AI providing planning, design guidance, review, and debugging support only.

Future feature work should follow the same pattern:
1. **Plan first** — agree on spec and architecture before coding.
2. **Write tests first** — RED/GREEN/REFACTOR cycle.
3. **Implement manually** — user writes all production code.
4. **Review systematically** — AI reviews across correctness, readability, security, performance.
5. **Document as you go** — keep architecture notes and decisions fresh.

## Development Environment

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Install root dependencies
npm install

# Install API service dependencies
npm --prefix services/api install

# Install shared contract dependencies
npm --prefix shared/contracts install
```

### Local Development

```bash
# Start frontend dev server (Vite)
npm run dev:web
# Frontend runs at http://localhost:5173

# In separate terminal, start API service
npm run dev:api
# API runs at http://localhost:4100

# Optional: start retrieval service stub
npm run dev:retrieval

# Or start all services together (web only currently)
npm run dev:all
```

### Testing

```bash
# Run all tests (contracts + API)
npm test

# Individual test suites
npm --prefix shared/contracts test
npm --prefix services/api test
```

### Linting & Building

```bash
# Lint all code
npm run lint

# Build all packages
npm run build

# Build specific packages
npm run build:web
npm run build:api
npm run build:retrieval
```

### Verification Checklist

Before marking any work complete:

```bash
npm test        # All tests pass
npm run lint    # No lint errors
npm run build   # Build succeeds
```

Then manually verify in browser (`npm run dev:web`):
- Chat: create conversation, send message, reopen history
- Library: verify placeholder states and disabled controls

## Architecture Principles

### Boundaries
- **Frontend** (`src/`) — React + Vite, feature-based structure.
- **API Service** (`services/api/`) — Node.js HTTP server with modular routes/persistence.
- **Shared Contracts** (`shared/contracts/`) — DTO schemas and assertions used by both.
- **Retrieval Service** (`services/retrieval/`) — Python stub for future document indexing.

### Key Abstractions
- **Provider pattern** — Chat provider interface isolated from Claude specifics.
- **Repository pattern** — Persistence logic behind conversation/message repos, migration-ready.
- **Module routes** — Each API feature (health, conversations, chat, auth, library) is a separate route module.

### Future Hardening
Before EC2 deployment, add:
- Real authentication (email magic-link or OAuth).
- Rate limiting and DDoS protection.
- Database migration path (SQLite → PostgreSQL).
- Document ingestion and vector search.
- Audit logging and monitoring.

See [VERIFICATION_MATRIX.md](VERIFICATION_MATRIX.md) for spec-to-test mapping.

## Asking for Help

If something breaks:
1. Run `npm test` to isolate the failure.
2. Check the error message and test name.
3. Review the test file to understand expected behavior.
4. Compare implementation against acceptance criteria in `tasks/plan.md`.
