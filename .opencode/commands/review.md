---
description: Review FlockMitra changes for bugs, security, and data integrity.
agent: qa-security
---

Review the current FlockMitra changes.

Scope or focus, if supplied:

$ARGUMENTS

Read AGENTS.md and inspect the relevant code and diffs.

Look for:
- Functional bugs and incorrect edge-case behavior.
- Incorrect bird-count, inventory, or financial calculations.
- Offline data loss, duplicate sync, and conflict-handling problems.
- Security vulnerabilities and authorization gaps.
- Exposed credentials or unsafe configuration.
- Missing validation, tests, error handling, or accessibility.
- Marathi/English localization issues.
- Android/iOS compatibility problems.
- Unsafe assumptions about AI output.

Report findings first, ordered by severity. Include file and location, impact, reproduction scenario where possible, and a recommended fix.

Distinguish confirmed defects from potential risks. Do not modify files during review. Do not claim checks passed unless they were run.
