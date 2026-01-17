# BlueTradie Working State

**Last Updated:** 2026-01-18

---

## Current PR

**PR1 — P0 Security Lockdown**

### Mode
Manual approvals for edits + commands (PR1–PR3)

### NOW
1. Create product docs (gtm-assumptions.md, proactive-ai-spec.md, pricing-v0.md, ai-usage.md)
2. Commit product docs
3. Run `/feature-dev:feature-dev` to plan PR1 implementation
4. **STOP** and wait for approval before any code edits

### NEXT
- PR1 implementation (after approval)
- Run all gates before merge
- OPS: Rotate secrets manually (separate from code)

---

## Quality Gates (All PRs Must Pass)

```bash
npm run lint           # ESLint passes
npm run check          # TypeScript type checking passes
npm run test           # Unit/integration tests pass
npm run build          # Production build succeeds
npm run test:smoke     # Smoke tests pass
npm run test:e2e       # Playwright E2E (REQUIRED if UI flow changed)
```

---

## Plugin Order (Per-PR Workflow)

| Step | Plugin | When Required |
|------|--------|---------------|
| 1 | `feature-dev:feature-dev` | Before writing any code |
| 2 | `serena` | Find all related paths/endpoints |
| 3 | `security-guidance` | **REQUIRED** for auth/payments/uploads |
| 4 | `typescript-lsp` | **REQUIRED** for refactors + auth middleware |
| 5 | `code-review` | After implementation complete |
| 6 | `review-pr` | Before merge |
| 7 | `ralph-loop` | **ONLY after tests are green** |
| 8 | `playwright` | For E2E tests on UI flows |
| 9 | `sentry` | After PR2 (logging + request IDs in place) |

---

## PR Ladder Status

| PR | Title | Status |
|----|-------|--------|
| PR0 | Repo hygiene | DONE |
| **PR1** | **P0 Security Lockdown** | **IN PROGRESS** |
| PR2 | Production Rails | Pending |
| PR-QUALITY-GATES | Quality Gates + CI | Pending |
| PR3 | Minimum Tests | Pending |
| PR4 | Feature Flags + Region | Pending |
| PR5 | Refactor Foundations | Pending |
| PR6 | AI Platform Layer | Pending |
| PR7a-f | Feature Build-Out | Pending |

---

## Key Files

- Master Plan: See conversation transcript or regenerate
- Session Transcript: `~/.claude/projects/C--Users-ckhen/<session-id>.jsonl`
- Secrets Checklist: `docs/ops/secrets-rotation-checklist.md` (to be created in PR1)
