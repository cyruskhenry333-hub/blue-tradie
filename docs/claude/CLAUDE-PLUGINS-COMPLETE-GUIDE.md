# Complete Claude Code Plugin Guide

All official plugins from the Claude Code marketplace with explanations.

---

## How to Install Plugins

```bash
# Install a plugin
claude plugin install <plugin-name>

# List installed plugins
claude plugin list

# Uninstall a plugin
claude plugin uninstall <plugin-name>
```

---

## LSP Plugins (Language Server Protocol) - 10 Plugins

These give Claude **real-time code intelligence** for specific languages - catching errors, providing accurate suggestions, and understanding your project structure.

| Plugin | Language | What It Does |
|--------|----------|--------------|
| **typescript-lsp** | TypeScript/JS | Real-time type checking, auto-imports, refactoring |
| **pyright-lsp** | Python | Type inference, catches None errors, understands virtual environments |
| **rust-analyzer-lsp** | Rust | Borrow checker feedback, lifetime analysis, macro expansion |
| **gopls-lsp** | Go | Module resolution, interface checks, go.mod awareness |
| **jdtls-lsp** | Java | Maven/Gradle dependency resolution, annotation processing |
| **csharp-lsp** | C# | NuGet packages, .NET framework targeting, Roslyn analysis |
| **swift-lsp** | Swift | Xcode integration, protocol conformance, SwiftUI previews |
| **php-lsp** | PHP | Composer autoloading, namespace resolution, framework awareness |
| **lua-lsp** | Lua | Game engine APIs (Love2D, Roblox), table type inference |
| **clangd-lsp** | C/C++ | Header resolution, compile_commands.json, memory safety hints |

**When to use:** Install the LSP for your project's language. If you're building in TypeScript (like many web apps), install `typescript-lsp`.

```bash
claude plugin install typescript-lsp
```

---

## Internal Workflow Plugins - 10 Plugins

These change **how Claude works** - adding specialized behaviors, agents, and workflows.

### Development Workflows

| Plugin | Command/Trigger | What It Does |
|--------|-----------------|--------------|
| **feature-dev** | `/feature-dev` | Guided feature development with 3 specialized agents: code-explorer, code-architect, code-reviewer |
| **code-review** | `/code-review` | Automated PR review with 5 parallel agents checking bugs, compliance, history, and code quality |
| **pr-review-toolkit** | `/pr-review` | Breaks PR reviews into 6 specialized passes (tests, errors, types, quality) |
| **frontend-design** | Auto-activates | UI/UX expertise - bold design choices, typography, animations, accessibility |
| **security-guidance** | Auto-activates | Real-time security linter - warns about vulnerabilities before production |

### Output & Learning Styles

| Plugin | Trigger | What It Does |
|--------|---------|--------------|
| **explanatory-output-style** | Auto-activates | Adds educational insights about implementation choices |
| **learning-output-style** | Auto-activates | Educational mode for learning codebases |

### Development Tools

| Plugin | Command | What It Does |
|--------|---------|--------------|
| **commit-commands** | `/commit` | Streamlined git commit workflow |
| **plugin-dev** | For developers | Tools for creating your own plugins |
| **hookify** | For developers | Create custom hooks for Claude behavior |
| **agent-sdk-dev** | For developers | Build custom agents |
| **code-simplifier** | `/simplify` | Reduces code complexity |
| **ralph-loop** | Advanced | Iterative improvement workflow |
| **example-plugin** | For learning | Template for building plugins |

---

## External Service Plugins - 13 Plugins

These connect Claude to **external platforms and APIs**.

### Version Control & Project Management

| Plugin | What It Does | Use Case |
|--------|--------------|----------|
| **github** | Full GitHub API - repos, PRs, branches, workflows | Manage your code on GitHub |
| **gitlab** | Merge requests, CI/CD pipelines | If you use GitLab instead |
| **linear** | Issue creation, status updates, project search | Modern issue tracking |
| **asana** | Task creation, updates, assignments | Project management |

### Database & Backend

| Plugin | What It Does | Use Case |
|--------|--------------|----------|
| **supabase** | Database, auth, storage, real-time | Your backend (already set up!) |
| **firebase** | Firestore, auth, cloud functions, hosting | Alternative to Supabase |

### Documentation & Code Intelligence

| Plugin | What It Does | Use Case |
|--------|--------------|----------|
| **context7** | Fetches real-time docs from source repos | Up-to-date library docs (already set up!) |
| **greptile** | Natural language search across codebases | Search large codebases semantically |
| **serena** | Semantic code analysis beyond syntax | Deep refactoring suggestions |

### Testing & Automation

| Plugin | What It Does | Use Case |
|--------|--------------|----------|
| **playwright** | Browser automation, screenshots, E2E testing | Test your app automatically |

### Payments & Communication

| Plugin | What It Does | Use Case |
|--------|--------------|----------|
| **stripe** | Webhook verification, subscription logic | Handle payments |
| **slack** | Search discussions, access team knowledge | Team communication |

### Framework-Specific

| Plugin | What It Does | Use Case |
|--------|--------------|----------|
| **laravel-boost** | Laravel intelligence - Artisan, Eloquent, best practices | If building with Laravel/PHP |

---

## Recommended for Blue Tradie (Your SaaS)

Based on building a tradie/service business app:

### Must-Have (Install Now)
```bash
claude plugin install frontend-design
claude plugin install typescript-lsp
claude plugin install security-guidance
```

### Important for Quality
```bash
claude plugin install code-review
claude plugin install feature-dev
```

### For Testing
```bash
claude plugin install playwright
```

### For Payments (When Ready)
```bash
claude plugin install stripe
```

---

## Quick Reference: Commands After Installing

| Plugin | How to Use |
|--------|------------|
| frontend-design | Automatic - just ask for UI work |
| security-guidance | Automatic - warns you of issues |
| feature-dev | Type `/feature-dev` then describe the feature |
| code-review | Type `/code-review` to review current changes |
| code-simplifier | Type `/simplify` to reduce complexity |
| commit-commands | Type `/commit` for streamlined commits |

---

## Already Set Up on Your System

| Plugin/MCP | Status |
|------------|--------|
| Context7 | ✅ Working |
| Supabase | ✅ Working (needs login on first use) |
| GitHub Code Reviewer | ✅ Working (via GitHub Actions) |

---

## Sources

- [Official Plugin Repository](https://github.com/anthropics/claude-plugins-official)
- [Claude Code Plugin Docs](https://code.claude.com/docs/en/plugins)
- [Plugin Marketplace Guide](https://www.petegypps.uk/blog/claude-code-official-plugin-marketplace-complete-guide-36-plugins-december-2025)
