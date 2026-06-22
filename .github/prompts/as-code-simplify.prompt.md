---
description: Simplify code while preserving exact behavior
name: as-code-simplify
argument-hint: Optional scope or target file
agent: agent
---
Use skill `code-simplification`.

Scope:
- Default to recently changed code unless user specifies otherwise.

Process:
1. Understand current behavior, callers, edge cases, and tests.
2. Identify simplification opportunities (nesting, long functions, naming, duplication, dead code).
3. Apply small simplifications incrementally.
4. Run tests after each meaningful change.
5. Verify full tests and build succeed.

Rules:
- Preserve behavior exactly.
- If a simplification causes failures, revert that simplification and re-evaluate.
- Avoid unrelated cleanup outside the selected scope.
