---
description: Break spec into small verifiable tasks with dependencies
name: as-plan
argument-hint: Optional scope, milestone, or deadline
agent: agent
---
Use the skill `planning-and-task-breakdown`.

Inputs:
- `SPEC.md` (or equivalent)
- Relevant codebase sections

Process:
1. Enter read-only plan mode.
2. Identify dependency graph between components.
3. Slice work vertically into end-to-end increments.
4. Write tasks with acceptance criteria and verification steps.
5. Add checkpoints between phases.
6. Present plan for human review.

Outputs:
- Save implementation plan to `tasks/plan.md`
- Save actionable checklist to `tasks/todo.md`

Rules:
- No code edits during planning.
- Prefer small tasks that can be implemented and verified in one focused session.
