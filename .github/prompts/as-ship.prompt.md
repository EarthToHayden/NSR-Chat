---
description: Run pre-launch fan-out review and produce GO or NO-GO decision
name: as-ship
argument-hint: Optional release context, environment, or risk tolerance
agent: agent
---
Use skill `shipping-and-launch`.

Phase A: Parallel specialist fan-out (single turn if possible)
1. `@code-reviewer` for five-axis review
2. `@security-auditor` for vulnerability and threat-model pass
3. `@test-engineer` for test coverage and risk analysis

Phase B: Merge in main context
1. Consolidate quality findings and deduplicate overlap
2. Promote security-critical items to blockers
3. Validate performance, accessibility, infrastructure, and documentation readiness

Phase C: Decision and rollback
Produce:
- Ship Decision: GO or NO-GO
- Blockers (must fix)
- Recommended fixes (should fix)
- Acknowledged risks and mitigations
- Rollback plan: triggers, exact steps, recovery target
- Full specialist reports

Rules:
- If any Critical finding exists, default to NO-GO unless user accepts risk.
- Rollback plan is mandatory for GO.
