---
description: Perform five-axis code review with prioritized findings
name: as-review
argument-hint: Optional scope: staged changes, branch, or files
agent: agent
---
Use skill `code-review-and-quality`.

Review across five axes:
1. Correctness
2. Readability
3. Architecture
4. Security (also use `security-and-hardening`)
5. Performance (also use `performance-optimization`)

Output format:
- Findings first, sorted by severity: Critical, Important, Suggestion
- Include concrete file and line references where possible
- Provide fix recommendation for each finding
- If no findings, state that explicitly and list residual risks/testing gaps
