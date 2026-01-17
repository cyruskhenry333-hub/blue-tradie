# Claude Code Features Guide

Quick reference for all the AI features set up for this project.

---

## Currently Installed

| MCP | Status | Purpose |
|-----|--------|---------|
| Context7 | ✅ Ready | Up-to-date documentation |
| Supabase | ✅ Ready | Database access |
| GitHub Reviewer | ✅ Ready | Auto PR reviews |

---

## 1. Ultrathink (Deep Reasoning)

Makes Claude think harder on complex problems.

**How to use:**
```
ultrathink: [your question or task here]
```

**Example:**
```
ultrathink: design the best database schema for handling job bookings with recurring appointments
```

**When to use:**
- Complex architecture decisions
- Debugging tricky bugs
- Planning multi-step features
- Weighing tradeoffs between approaches

---

## 2. Plan Mode (Explore Before Coding)

Claude explores your codebase and creates a plan before making changes.

**How to enable:**
- Press `Shift+Tab` twice during a chat
- Or start Claude with: `claude --permission-mode plan`

**When to use:**
- Large refactoring tasks
- Adding features that touch multiple files
- When you want to review the approach before Claude writes code

---

## 3. Context7 MCP (Up-to-Date Documentation)

Fetches real, current documentation instead of potentially outdated training data.

**How to use:**
Add `use context7` to your prompt:
```
How do I set up authentication in Next.js 14? use context7
```

```
Show me the latest React Query syntax for mutations use context7
```

**When to use:**
- Learning new libraries
- Checking current API syntax
- When Claude's answer seems outdated

---

## 4. Supabase MCP (Database Access)

Claude can see your actual database schema and write accurate queries.

**How to use:**
Just ask about your database - Claude will use it automatically:
```
Show me all the tables in my database
```

```
Write a query to get all jobs created in the last 7 days
```

```
Create a migration to add a 'status' column to the jobs table
```

**First time:** It will open your browser to log in to Supabase.

**When to use:**
- Writing database queries
- Creating migrations
- Understanding your data structure

---

## 5. GitHub Code Reviewer

Claude automatically reviews your pull requests.

**Automatic:** Every PR gets reviewed when opened.

**Manual:** Comment `@claude` on any PR or issue:
```
@claude review this for security issues
```

```
@claude explain what this change does
```

```
@claude suggest improvements
```

---

## Quick Reference Table

| Feature | Trigger | Purpose |
|---------|---------|---------|
| Ultrathink | `ultrathink: [prompt]` | Deep reasoning |
| Plan Mode | `Shift+Tab` twice | Explore before coding |
| Context7 | `use context7` in prompt | Current documentation |
| Supabase | Automatic for DB questions | Database access |
| GitHub Review | `@claude` in PR comments | Code review |

---

## MCP Commands (Terminal)

```bash
# List all configured MCPs
claude mcp list

# Check MCP status in Claude Code
/mcp

# Remove an MCP
claude mcp remove [name]
```

---

## Tips

1. **Combine features:** `ultrathink: design the auth flow for my app use context7`

2. **Be specific:** Instead of "fix my code", say "fix the login function that's returning null on line 45"

3. **Ask for honest feedback:** Claude will tell you if your code has issues - just ask directly

4. **Use plan mode for big changes:** Prevents Claude from writing code you don't want

---

## Recommended MCPs to Add Later

### Stripe (Payments) - Essential for SaaS
```bash
claude mcp add stripe -- npx -y @stripe/mcp --api-key YOUR_STRIPE_KEY
```
Get your key at: https://dashboard.stripe.com/apikeys

### Sentry (Error Monitoring)
```bash
claude mcp add --transport http sentry 'https://mcp.sentry.dev/sse'
```
Track bugs and crashes in production.

### Playwright (Automated Testing)
```bash
claude mcp add playwright -- npx -y @anthropic-ai/claude-code-mcp-server-playwright
```
Browser automation and E2E testing.

### Figma (Design to Code)
```bash
claude mcp add --transport http figma 'https://mcp.figma.com/sse'
```
Convert Figma designs directly to code.

### Cloudflare (Deployment & Edge)
For global deployment, edge functions, and fast performance.

---

## What Makes a SaaS Impress Developers

| Area | What They Look For |
|------|-------------------|
| Error Handling | Graceful errors, not crashes |
| Loading States | Skeletons/spinners, not blank screens |
| Testing | Unit tests, E2E tests, CI pipeline |
| Security | Proper auth, input validation, rate limiting |
| Monitoring | Error tracking (Sentry/LogRocket) |
| Performance | Fast load times, optimized queries |
| Code Structure | Clean, consistent patterns |

---

## Useful Links

- MCP Directory: https://mcp.so/
- Awesome Claude Code: https://github.com/jmanhype/awesome-claude-code
- Claude Code Docs: https://docs.anthropic.com/en/docs/claude-code
