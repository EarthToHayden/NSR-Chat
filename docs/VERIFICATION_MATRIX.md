# Verification Matrix: NSR AI Chat Platform Foundation

Maps SPEC.md acceptance criteria to test files and manual verification steps.

| # | Acceptance Criterion | Test/Verification |
|---|---|---|
| 1 | Design B is the default UI foundation and supports desktop/mobile layouts | Manual browser: npm run dev, check Chat/Library routes responsive layout |
| 2 | User can create a new conversation and send a chat message | Manual: npm run dev, create conversation, type message |
| 3 | AI response is returned through backend provider adapter path with streaming output | Test: `services/api/tests/integration/chat-stream-lifecycle.spec.mjs` + manual: observe streamed response in browser |
| 4 | Conversation and messages are persisted in local backend datastore | Test: `services/api/tests/unit/conversation-repository.spec.mjs` + `services/api/tests/integration/persistence-restart.spec.mjs` |
| 5 | User can view prior conversations and reopen one to review message history | Manual: npm run dev, create 2+ conversations, click each to verify history loads |
| 6 | File library route exists with placeholder/filter shell UI, clear not-yet-implemented states, and is visible in main navigation | Manual: npm run dev, click "Library" in nav, verify placeholder copy and disabled inputs |
| 7 | Auth extension points exist in code structure without implementing login flow | Test: `services/api/tests/unit/task-9-placeholder-routes.spec.mjs` (GET /api/auth/session returns 501) |
| 8 | Provider abstraction supports Claude as first adapter without coupling UI to provider specifics | Test: `services/api/tests/unit/claude-provider.spec.mjs` |
| 9 | Local stack can run end-to-end with documented commands | Manual: follow [DEVELOPER.md](DEVELOPER.md) command sequence |
| 10 | Architecture and module boundaries remain compatible with future EC2 deployment and multi-user hardening | Manual code review: verify repository/provider abstractions and config via env vars |
| 11 | Initial foundation implementation is completed manually by the user, with AI used only as guide/reviewer | Process verified: user implemented all Tasks 1-10 manually per [DEVELOPER.md](DEVELOPER.md) |

## Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm --prefix shared/contracts test
npm --prefix services/api test

# Type check and lint
npm run lint

# Build all packages
npm run build
```

## Next Phase

Foundation is complete. Remaining deferred work before EC2 deployment:

- Email magic-link authentication (`/api/auth/magic-link` currently returns 501)
- Document ingestion, indexing, and vector search (`/api/library/search` currently returns 501)
- PostgreSQL migration (replace SQLite via repository swap)
- Rate limiting, audit logging, and multi-user session hardening