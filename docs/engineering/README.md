# Engineering Documentation

This directory contains workflow and process documentation for BlueTradie development.

## Quick Links

| Document | Purpose |
|----------|---------|
| [WORKING_STATE.md](./WORKING_STATE.md) | Current PR, tasks, and progress tracking |
| [CLAUDE_RESTART.md](./CLAUDE_RESTART.md) | Copy/paste prompt for restarting Claude sessions |
| [SESSION_END_CHECKLIST.md](./SESSION_END_CHECKLIST.md) | Checklist before ending a session |

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/status.mjs` | Print repo + working state status |

## Usage

```bash
# Check current status
node scripts/status.mjs

# Run all quality gates
npm run lint && npm run check && npm run test && npm run build && npm run test:smoke
```

## Related Documentation

- `docs/product/` - Product specifications and pricing
- `docs/ops/` - Operations checklists and procedures
