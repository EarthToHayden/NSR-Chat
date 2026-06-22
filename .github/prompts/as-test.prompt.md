---
description: Run TDD workflow and prove behavior with tests
name: as-test
argument-hint: Optional area, file, or bug description
agent: agent
---
Use skill `test-driven-development`.

For new features:
1. Write tests for expected behavior (fail first).
2. Implement to make tests pass.
3. Refactor with tests still passing.

For bug fixes (Prove-It pattern):
1. Add a failing test that reproduces the bug.
2. Confirm it fails.
3. Implement the fix.
4. Confirm the test passes.
5. Run full suite for regressions.

For browser behavior, also use `browser-testing-with-devtools`.

Output:
- Report what failed before, what changed, and what now passes.
