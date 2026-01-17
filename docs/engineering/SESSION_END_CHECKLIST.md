# Session End Checklist

Before ending a Claude session, complete these steps:

---

## 1. Update Working State

- [ ] Edit `docs/engineering/WORKING_STATE.md`
- [ ] Update "Last Updated" date
- [ ] Update "NOW" section with current task status
- [ ] Update "NEXT" section with next steps
- [ ] Update PR Ladder status if any PRs completed

---

## 2. Checkpoint Commit

```bash
git add docs/engineering/WORKING_STATE.md
git commit -m "chore: checkpoint working state"
```

---

## 3. Run Gates (If Code Changed)

Only required if you made code changes in this session:

```bash
npm run lint           # ESLint passes
npm run check          # TypeScript type checking passes
npm run test           # Unit/integration tests pass
npm run build          # Production build succeeds
npm run test:smoke     # Smoke tests pass
```

If any gate fails, fix before ending session or document the failure in WORKING_STATE.md.

---

## 4. Push (If On Feature Branch)

```bash
# Check branch
git branch

# If on feature branch (not main for docs-only changes):
git push origin <branch-name>

# If docs-only on main:
git push origin main
```

---

## 5. Notes for Next Session

Document anything the next session needs to know:

- Blockers encountered
- Decisions made
- Open questions
- Files that need attention

Add these to the "NEXT" section in WORKING_STATE.md.

---

## Quick Reference

```bash
# Full end-of-session flow (code changed):
git status
npm run lint && npm run check && npm run test && npm run build
# Edit WORKING_STATE.md
git add -A
git commit -m "chore: checkpoint working state"
git push

# Docs-only flow:
git status
# Edit WORKING_STATE.md
git add docs/
git commit -m "chore: checkpoint working state"
git push origin main
```
