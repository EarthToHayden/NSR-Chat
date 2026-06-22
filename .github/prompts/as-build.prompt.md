---
description: Implement the next task incrementally with verification
name: as-build
argument-hint: Optional task id or feature slice
agent: agent
---
Use skills `incremental-implementation` and `test-driven-development`.

For the next pending task in `tasks/todo.md`:
1. Read acceptance criteria.
2. Gather relevant context from existing code.
3. Write a failing test first (RED).
4. Implement minimum code to pass (GREEN).
5. Refactor while keeping tests green.
6. Run full tests for regressions.
7. Run build to verify compilation.
8. Mark the task complete.

If any step fails, use `debugging-and-error-recovery`.

Rules:
- Implement one thin vertical slice at a time.
- Keep changes minimal and scoped to the current task.
