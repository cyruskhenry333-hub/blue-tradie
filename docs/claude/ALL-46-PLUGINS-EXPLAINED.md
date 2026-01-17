# All 46 Claude Code Plugins Explained (Beginner Friendly)

Simple explanations of what each plugin does and whether you need it.

---

## Quick Legend

- ⭐ = Highly recommended for your SaaS app
- ✅ = You already have this set up
- 🔧 = For developers building tools (not needed yet)
- 📝 = For specific languages (only if you use that language)

---

## 1. frontend-design ⭐ (96.4K installs)

**What it does:** Makes Claude really good at designing user interfaces (the visual part of your app - buttons, layouts, colors, etc.)

**In simple terms:** When you ask Claude to build a page or component, this plugin makes it create beautiful, professional-looking designs instead of basic/ugly ones.

**Example use:** "Build me a dashboard for tradies to see their jobs"

**Should you install?** YES - essential for making your app look professional

---

## 2. context7 ✅ (71.8K installs)

**What it does:** Fetches the latest documentation for coding libraries

**In simple terms:** When Claude helps you code, it checks the actual current docs instead of using potentially outdated knowledge. Prevents "this function doesn't exist anymore" errors.

**Example use:** "How do I use React 19's new features? use context7"

**Should you install?** You already have this set up via MCP!

---

## 3. github (47.7K installs)

**What it does:** Connects Claude to your GitHub account

**In simple terms:** Claude can create repositories, manage pull requests, check your code history, and work with GitHub directly.

**Example use:** "Create a new branch called feature/booking-system"

**Should you install?** Useful, but you already have the GitHub code reviewer set up

---

## 4. code-review ⭐ (44.9K installs)

**What it does:** Reviews your code using 5 different "expert" perspectives

**In simple terms:** Like having 5 senior developers look at your code at once - one checks for bugs, one checks security, one checks style, etc.

**Example use:** Type `/code-review` after writing code

**Should you install?** YES - catches problems before they become real issues

---

## 5. feature-dev ⭐ (44.6K installs)

**What it does:** Guides you through building features step-by-step

**In simple terms:** Instead of just writing code, Claude first explores your codebase, designs the architecture, then builds it properly. Like having a senior developer mentor you.

**Example use:** Type `/feature-dev` then "Add a booking calendar for tradies"

**Should you install?** YES - helps build features the right way

---

## 6. serena (35.2K installs)

**What it does:** Deep code analysis that understands what your code means

**In simple terms:** Regular tools see code as text. Serena understands the meaning - like the difference between reading words and understanding a story.

**Example use:** "Analyze my codebase and suggest refactoring improvements"

**Should you install?** Nice to have for complex refactoring

---

## 7. typescript-lsp ⭐ (32.2K installs)

**What it does:** Gives Claude real-time TypeScript/JavaScript intelligence

**In simple terms:** Claude can see type errors, suggest correct imports, and understand your code structure in real-time. Like having spell-check but for code.

**Example use:** Automatic - just works when you're coding in TypeScript

**Should you install?** YES if your app uses TypeScript/JavaScript (most web apps do)

---

## 8. commit-commands (30K installs)

**What it does:** Streamlines git commit workflow

**In simple terms:** Makes it easier to save your code changes with proper descriptions. Type `/commit` instead of manual git commands.

**Example use:** `/commit` - Claude writes a good commit message for your changes

**Should you install?** Helpful for cleaner git history

---

## 9. playwright ⭐ (28.1K installs)

**What it does:** Automates browser testing

**In simple terms:** Claude can open a browser, click buttons, fill forms, and verify your app works - automatically. Like a robot tester.

**Example use:** "Write tests that verify users can sign up and log in"

**Should you install?** YES - proves your app actually works

---

## 10. security-guidance ⭐ (25.5K installs)

**What it does:** Warns you about security problems as you code

**In simple terms:** Like a security guard watching your code. If you accidentally expose passwords or create vulnerabilities, it warns you immediately.

**Example use:** Automatic - warns you when you do something risky

**Should you install?** YES - essential for any app handling user data

---

## 11. code-simplifier (25.5K installs)

**What it does:** Makes complex code simpler and cleaner

**In simple terms:** If your code is messy or confusing, this agent rewrites it to be cleaner while doing the same thing.

**Example use:** `/simplify` on a messy function

**Should you install?** Good for cleaning up "vibe coded" messes

---

## 12. ralph-loop (22.9K installs)

**What it does:** Iterative improvement loops

**In simple terms:** Claude keeps improving something over and over until it's really good. Like revising an essay multiple times.

**Example use:** Advanced - for iterative refinement workflows

**Should you install?** Not essential for beginners

---

## 13. supabase ✅ (20.9K installs)

**What it does:** Connects Claude to your Supabase database

**In simple terms:** Claude can see your actual database tables, write accurate queries, and help build features using your real data structure.

**Example use:** "Show me all jobs in my database from this week"

**Should you install?** You already have this set up via MCP!

---

## 14. pr-review-toolkit (20.1K installs)

**What it does:** Comprehensive pull request review

**In simple terms:** Reviews your code changes from 6 different angles - tests, error handling, types, code quality, etc.

**Example use:** Automatic on pull requests

**Should you install?** Good addition to code-review

---

## 15. agent-sdk-dev 🔧 (18.2K installs)

**What it does:** Tools for building AI agents

**In simple terms:** For developers who want to create their own AI assistants. Not for using Claude, but for building Claude-like tools.

**Example use:** Building custom AI agents

**Should you install?** NO - this is for advanced developers building AI tools

---

## 16. figma ⭐ (18.1K installs)

**What it does:** Connects Claude to Figma designs

**In simple terms:** If you have designs in Figma, Claude can see them and convert them directly to code. Design → Code automatically.

**Example use:** "Convert this Figma design to React components"

**Should you install?** YES if you use Figma for designs

---

## 17. pyright-lsp 📝 (17.8K installs)

**What it does:** Python language intelligence

**In simple terms:** Same as typescript-lsp but for Python. Real-time error checking and suggestions.

**Example use:** Automatic when coding Python

**Should you install?** Only if your app uses Python

---

## 18. atlassian (17.8K installs)

**What it does:** Connects to Jira and Confluence

**In simple terms:** If your team uses Jira for tasks or Confluence for docs, Claude can read and create tickets/pages.

**Example use:** "Create a Jira ticket for the login bug"

**Should you install?** Only if you use Atlassian products

---

## 19. explanatory-output-style (12.3K installs)

**What it does:** Claude explains WHY it's doing things

**In simple terms:** Instead of just writing code, Claude teaches you why it made certain choices. Great for learning.

**Example use:** Automatic - adds explanations to responses

**Should you install?** YES if you want to learn as you build

---

## 20. plugin-dev 🔧 (11.6K installs)

**What it does:** Tools for building Claude plugins

**In simple terms:** For developers who want to create their own plugins. Not for using plugins.

**Example use:** Creating custom plugins

**Should you install?** NO - for plugin developers only

---

## 21. notion (11K installs)

**What it does:** Connects Claude to Notion

**In simple terms:** Claude can read your Notion docs, create pages, and search your workspace.

**Example use:** "Find my product roadmap in Notion"

**Should you install?** Only if you use Notion

---

## 22. greptile (10.5K installs)

**What it does:** AI-powered codebase search

**In simple terms:** Search your entire codebase using natural language. Instead of searching for exact text, describe what you're looking for.

**Example use:** "Find where user authentication happens"

**Should you install?** Useful for large codebases

---

## 23. hookify 🔧 (10K installs)

**What it does:** Create custom hooks for Claude's behavior

**In simple terms:** Advanced customization - make Claude do specific things automatically in certain situations.

**Example use:** "Always run tests before committing"

**Should you install?** Not essential for beginners

---

## 24. linear (9.5K installs)

**What it does:** Connects to Linear issue tracker

**In simple terms:** If you use Linear for project management, Claude can create and manage issues.

**Example use:** "Create a Linear issue for the payment bug"

**Should you install?** Only if you use Linear

---

## 25. learning-output-style (8.3K installs)

**What it does:** Interactive learning mode

**In simple terms:** Claude asks YOU to think about code changes before showing answers. Forces you to learn instead of just copying.

**Example use:** Automatic - makes coding educational

**Should you install?** If you want to learn while building

---

## 26. vercel (7.7K installs)

**What it does:** Connects to Vercel hosting platform

**In simple terms:** Claude can deploy your app, manage deployments, and check deployment status.

**Example use:** "Deploy my app to production"

**Should you install?** YES if you use Vercel for hosting

---

## 27. sentry ⭐ (7.4K installs)

**What it does:** Connects to Sentry error monitoring

**In simple terms:** See what errors are happening in your live app. Claude can help debug real production issues.

**Example use:** "What errors happened today in production?"

**Should you install?** YES - essential for production apps

---

## 28. laravel-boost 📝 (6.9K installs)

**What it does:** Laravel PHP framework intelligence

**In simple terms:** Makes Claude really good at Laravel development - Artisan commands, Eloquent ORM, Laravel best practices.

**Example use:** Automatic when working with Laravel

**Should you install?** Only if you use Laravel/PHP

---

## 29. gopls-lsp 📝 (6.7K installs)

**What it does:** Go language intelligence

**In simple terms:** Real-time error checking and suggestions for Go code.

**Example use:** Automatic when coding Go

**Should you install?** Only if your app uses Go

---

## 30. slack (6.6K installs)

**What it does:** Connects Claude to Slack

**In simple terms:** Search Slack messages, access channel history. Find decisions and discussions from your team.

**Example use:** "Find the Slack discussion about the pricing feature"

**Should you install?** If you use Slack for team communication

---

## 31. gitlab (6.1K installs)

**What it does:** Connects to GitLab

**In simple terms:** Same as the GitHub plugin but for GitLab users. Manage repos, merge requests, CI/CD.

**Example use:** "Create a merge request for my changes"

**Should you install?** Only if you use GitLab (you use GitHub)

---

## 32. csharp-lsp 📝 (6K installs)

**What it does:** C# language intelligence

**In simple terms:** Real-time error checking for C# code.

**Example use:** Automatic when coding C#

**Should you install?** Only if you use C#/.NET

---

## 33. rust-analyzer-lsp 📝 (5.8K installs)

**What it does:** Rust language intelligence

**In simple terms:** Real-time error checking for Rust - borrow checker, lifetimes, etc.

**Example use:** Automatic when coding Rust

**Should you install?** Only if you use Rust

---

## 34. stripe ⭐ (5.2K installs)

**What it does:** Connects Claude to Stripe payments

**In simple terms:** Claude can help build payment features with your actual Stripe setup - subscriptions, invoices, webhooks.

**Example use:** "Set up a subscription plan for $29/month"

**Should you install?** YES when you're ready to add payments

---

## 35. php-lsp 📝 (5K installs)

**What it does:** PHP language intelligence

**In simple terms:** Real-time error checking for PHP code.

**Example use:** Automatic when coding PHP

**Should you install?** Only if you use PHP

---

## 36. jdtls-lsp 📝 (4.9K installs)

**What it does:** Java language intelligence

**In simple terms:** Real-time error checking for Java - Maven/Gradle dependencies, refactoring.

**Example use:** Automatic when coding Java

**Should you install?** Only if you use Java

---

## 37. clangd-lsp 📝 (4.2K installs)

**What it does:** C/C++ language intelligence

**In simple terms:** Real-time error checking for C/C++ - headers, memory safety.

**Example use:** Automatic when coding C/C++

**Should you install?** Only if you use C/C++

---

## 38. swift-lsp 📝 (4.1K installs)

**What it does:** Swift language intelligence

**In simple terms:** Real-time error checking for Swift - Xcode integration, SwiftUI.

**Example use:** Automatic when coding Swift

**Should you install?** Only if you're building iOS apps

---

## 39. firebase (4.1K installs)

**What it does:** Connects to Google Firebase

**In simple terms:** Alternative to Supabase. Manage Firestore database, authentication, cloud functions.

**Example use:** "Query all users from Firestore"

**Should you install?** NO - you're using Supabase instead

---

## 40. lua-lsp 📝 (2.6K installs)

**What it does:** Lua language intelligence

**In simple terms:** Real-time error checking for Lua - used in games (Roblox, Love2D).

**Example use:** Automatic when coding Lua

**Should you install?** Only if you're building games

---

## 41. huggingface-skills (2.2K installs)

**What it does:** Connects to Hugging Face AI models

**In simple terms:** Use open-source AI models for tasks like image generation, text analysis, etc.

**Example use:** "Generate an image using Stable Diffusion"

**Should you install?** Only if you need AI/ML features

---

## 42. asana (1.7K installs)

**What it does:** Connects to Asana project management

**In simple terms:** Claude can create tasks, update projects, and manage work in Asana.

**Example use:** "Create an Asana task for the homepage redesign"

**Should you install?** Only if you use Asana

---

## 43. kotlin-lsp 📝 (1.4K installs)

**What it does:** Kotlin language intelligence

**In simple terms:** Real-time error checking for Kotlin - used in Android development.

**Example use:** Automatic when coding Kotlin

**Should you install?** Only if you're building Android apps

---

## 44. pinecone (668 installs)

**What it does:** Connects to Pinecone vector database

**In simple terms:** For AI apps that need to search through data semantically (like "find similar items").

**Example use:** "Search for documents similar to this one"

**Should you install?** Only if you're building AI search features

---

## 45. circleback (286 installs)

**What it does:** Conversation context from Circleback meetings

**In simple terms:** Access meeting notes and conversation history from Circleback.

**Example use:** "What did we discuss in last week's meeting?"

**Should you install?** Only if you use Circleback

---

## 46. superpowers (0 installs - New!)

**What it does:** Brainstorming and sub-agent workflows

**In simple terms:** Teaches Claude advanced problem-solving techniques - brainstorming, breaking problems into parts.

**Example use:** Complex problem-solving

**Should you install?** Experimental - try if you want cutting-edge features

---

# Summary: What YOU Should Install for Blue Tradie

## Must Install Now ⭐
```bash
claude plugin install frontend-design
claude plugin install security-guidance
claude plugin install typescript-lsp
claude plugin install code-review
claude plugin install feature-dev
```

## Install When Ready
```bash
claude plugin install playwright      # When you want automated tests
claude plugin install stripe         # When you add payments
claude plugin install sentry         # When you go to production
claude plugin install figma          # If you use Figma for designs
claude plugin install vercel         # If you deploy on Vercel
```

## Already Set Up ✅
- context7 (via MCP)
- supabase (via MCP)
- github (via GitHub Actions code reviewer)

## Don't Need (Unless Specified)
- All the language LSPs except typescript-lsp (unless you use those languages)
- Developer tools (plugin-dev, hookify, agent-sdk-dev)
- Platform-specific (atlassian, linear, asana, slack, notion, gitlab, firebase)
