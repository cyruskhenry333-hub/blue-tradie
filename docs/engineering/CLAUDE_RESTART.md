# Claude Restart Protocol

Copy and paste this entire block when starting a new Claude session:

---

```
RESTART PROTOCOL — Execute these steps in order:

1. Print current state:
   - pwd
   - git branch
   - git status
   - git log --oneline -3

2. Read state files:
   - Read: docs/engineering/WORKING_STATE.md
   - Read: docs/engineering/README.md (for linked docs)

3. Output summary in this format:

   ## You Are Here
   - Current PR: [from WORKING_STATE]
   - Mode: [from WORKING_STATE]
   - Branch: [from git branch]
   - Clean: [yes/no from git status]

   ## Next Task
   [NOW section from WORKING_STATE]

   ## Gates Required
   npm run lint
   npm run check
   npm run test
   npm run build
   npm run test:smoke
   npm run test:e2e (if UI changed)

   ## Plugin Order
   1. feature-dev:feature-dev
   2. serena
   3. security-guidance (auth/payments/uploads)
   4. typescript-lsp (refactors)
   5. code-review
   6. review-pr
   7. ralph-loop (after tests green)
   8. playwright (E2E)
   9. sentry (after PR2)

4. STOP and wait for user approval before any actions.

IMPORTANT:
- Manual approvals required for PR1–PR3
- No bypass allowed
- Feature-flag OFF any incomplete/demo features
- All gates must pass before merge
```

---

## Quick Commands

```bash
# Check status
node scripts/status.mjs

# Run all gates
npm run lint && npm run check && npm run test && npm run build && npm run test:smoke

# Checkpoint commit
git add -A && git commit -m "chore: checkpoint working state"
```
