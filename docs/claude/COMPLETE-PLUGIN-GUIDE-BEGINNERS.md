# Complete Plugin Guide for Beginners

Every plugin explained in plain English with examples. No jargon left behind.

---

## Jargon Dictionary (Reference This Anytime)

| Term | Plain English |
|------|---------------|
| **API** | A way for apps to talk to each other. Like a waiter taking your order to the kitchen. |
| **Repository (Repo)** | A folder where your code lives, tracked by Git. Like a project folder with history. |
| **Pull Request (PR)** | Asking to add your code changes to the main project. Like submitting homework for review. |
| **Commit** | Saving a snapshot of your code with a description. Like saving a game checkpoint. |
| **Branch** | A separate copy of your code to work on without affecting the main version. Like a draft. |
| **Deploy** | Putting your app on the internet so people can use it. Like publishing a book. |
| **Production** | The live version of your app that real users see. |
| **Database** | Where your app stores information (users, orders, etc.). Like a spreadsheet on steroids. |
| **Query** | A question you ask a database. "Show me all users who signed up today." |
| **Type/Type Checking** | Rules about what kind of data goes where. "This must be a number, not text." |
| **Refactoring** | Improving code without changing what it does. Like editing an essay for clarity. |
| **Component** | A reusable piece of your app's interface. Like a LEGO brick. |
| **UI/UX** | User Interface (what it looks like) / User Experience (how it feels to use). |
| **Webhook** | Automatic notification when something happens. Like getting a text when your package ships. |
| **LSP (Language Server Protocol)** | A helper that understands your code and catches errors in real-time. |
| **MCP (Model Context Protocol)** | A way to connect Claude to external services and data. |
| **CI/CD** | Automatic testing and deploying when you save code. Like auto-spellcheck + auto-publish. |
| **End-to-End (E2E) Testing** | Testing your whole app like a real user would. Clicking buttons, filling forms. |
| **Vector Database** | A database that finds "similar" things, not exact matches. Used for AI search. |

---

# All 46 Plugins Explained

---

## PLUGIN 1: frontend-design ⭐
**Installs:** 96,400 | **Recommended:** YES

### What is "Frontend"?
The frontend is everything users see and interact with - buttons, menus, colors, layouts, animations. It's the "face" of your app.

### What This Plugin Does
Makes Claude an expert at creating beautiful, professional user interfaces. Without this, Claude creates functional but basic-looking designs. With this, Claude creates designs that look like a professional designer made them.

### What Changes When You Install It
- Claude automatically thinks about colors, spacing, typography (fonts)
- Creates smooth animations and hover effects
- Makes sure designs work on phones AND computers (responsive)
- Considers accessibility (can people with disabilities use it?)

### Example: Without frontend-design
```
You: "Create a login page"

Claude creates:
- Basic white form
- Plain text inputs
- Simple blue button
- Works, but looks like it's from 2005
```

### Example: With frontend-design
```
You: "Create a login page"

Claude creates:
- Modern gradient background
- Smooth input fields with focus animations
- Button with hover effects and loading states
- Subtle shadows and rounded corners
- Mobile-friendly layout
- Looks like a real startup's login page
```

### How to Use It
Just ask for any UI work - it activates automatically:
- "Create a dashboard for tradies to see their jobs"
- "Build a pricing page with 3 tiers"
- "Design a mobile menu that slides in"

### Install Command
```bash
claude plugin install frontend-design
```

---

## PLUGIN 2: context7 ✅
**Installs:** 71,800 | **Status:** You already have this via MCP!

### The Problem It Solves
Programming languages and tools update constantly. React 18 works differently than React 19. Claude was trained on old documentation, so it might suggest outdated code that doesn't work anymore.

### What This Plugin Does
When you ask about a library (like React, Next.js, Tailwind), Context7 fetches the REAL, CURRENT documentation from the internet instead of Claude guessing from memory.

### Example: Without context7
```
You: "How do I fetch data in Next.js?"

Claude: "Use getServerSideProps..."
(This might be outdated advice for older Next.js versions)
```

### Example: With context7
```
You: "How do I fetch data in Next.js? use context7"

Claude: *fetches current Next.js 15 docs*
"In Next.js 15, you should use Server Components with async/await..."
(Accurate, current advice)
```

### How to Use It
Add "use context7" to your question:
- "How do I use Tailwind CSS v4? use context7"
- "Show me Supabase authentication examples use context7"

---

## PLUGIN 3: github
**Installs:** 47,700 | **Recommended:** Optional (you have the code reviewer already)

### What is GitHub?
GitHub is where developers store their code online. It tracks every change ever made (version control) and lets teams collaborate. Your Blue Tradie code lives on GitHub.

### What This Plugin Does
Lets Claude directly interact with GitHub:
- Create new branches (separate workspaces for new features)
- Open pull requests (submit code for review)
- Read issues (bug reports and feature requests)
- Check what changed in your code history

### Example Uses
```
You: "Create a new branch called feature/payment-system"
Claude: *creates the branch on GitHub*

You: "What issues are open on my repo?"
Claude: *lists all open issues*

You: "Create a pull request for my current changes"
Claude: *opens a PR with a description*
```

### How to Use It
After installing, just ask GitHub-related questions naturally.

### Install Command
```bash
claude plugin install github
```

---

## PLUGIN 4: code-review ⭐
**Installs:** 44,900 | **Recommended:** YES

### What is Code Review?
When you write code, someone else should check it before it goes live. They look for bugs, security issues, and ways to improve. Professional teams always do this.

### What This Plugin Does
Creates 5 AI "experts" that review your code from different angles:
1. **Bug Hunter** - Looks for code that might crash or behave wrong
2. **Security Expert** - Looks for vulnerabilities hackers could exploit
3. **Style Checker** - Makes sure code follows best practices
4. **History Checker** - Compares to your previous code patterns
5. **CLAUDE.md Compliance** - Checks against your project rules

### Why 5 Reviewers?
One reviewer might miss something. Five reviewers catch more issues. It's like having 5 senior developers look at your code for free.

### Example Use
```
You: /code-review

Claude: "Reviewing your recent changes..."

Results:
🔴 CRITICAL: SQL injection vulnerability in search function (line 45)
🟡 WARNING: Missing error handling in payment.js (line 102)
🟢 SUGGESTION: Consider caching this database query
🟢 STYLE: Inconsistent naming - use camelCase everywhere
```

### How to Use It
Type `/code-review` after making changes.

### Install Command
```bash
claude plugin install code-review
```

---

## PLUGIN 5: feature-dev ⭐
**Installs:** 44,600 | **Recommended:** YES

### The Problem It Solves
When you ask Claude to "add a booking system," it might just start writing code immediately. But good development requires:
1. Understanding your existing code first
2. Designing how the feature will work
3. Building it properly
4. Reviewing what was built

### What This Plugin Does
Guides you through professional feature development with 3 specialized agents:

1. **Code Explorer** - First, explores your codebase to understand how things work
2. **Code Architect** - Designs how the new feature should be built
3. **Code Reviewer** - Checks the quality of what was built

### Example Use
```
You: /feature-dev Add a job scheduling system where tradies can set their availability

Claude (Explorer): "Let me look at your existing code structure..."
*examines your database, existing pages, components*

Claude (Architect): "Based on your codebase, here's my plan:
1. Add availability table to database
2. Create calendar component
3. Add API endpoints for CRUD operations
4. Build settings page for tradies
Does this approach work for you?"

You: "Yes, go ahead"

Claude: *builds the feature following the plan*

Claude (Reviewer): "Feature complete. Here's my review:
✅ Database schema is good
✅ API endpoints are secure
⚠️ Consider adding loading states to the calendar"
```

### How to Use It
Type `/feature-dev` then describe what you want to build.

### Install Command
```bash
claude plugin install feature-dev
```

---

## PLUGIN 6: serena
**Installs:** 35,200 | **Recommended:** Nice to have

### What is "Semantic" Analysis?
Regular code search finds exact text: searching "login" finds the word "login."
Semantic analysis understands MEANING: searching "authentication" would also find "signIn," "verifyUser," "checkCredentials" because they mean similar things.

### What This Plugin Does
Analyzes your code's meaning, not just its text. Understands relationships between different parts of your code. Suggests intelligent refactoring based on what your code is trying to do.

### Example Use
```
You: "Find all the places where I handle user permissions"

Without Serena: *searches for the word "permission"*

With Serena: *finds permission checks, role validations,
access control, authorization logic - even if they use
different words*
```

### How to Use It
Ask for code analysis or refactoring suggestions.

### Install Command
```bash
claude plugin install serena
```

---

## PLUGIN 7: typescript-lsp ⭐
**Installs:** 32,200 | **Recommended:** YES (if using TypeScript/JavaScript)

### What is TypeScript?
TypeScript is JavaScript with "types" - rules about what data goes where. Instead of discovering bugs when users find them, TypeScript catches them while you code.

Example:
```javascript
// JavaScript - no types, bug found later
function add(a, b) {
  return a + b;
}
add("5", 3); // Returns "53" not 8 - bug!

// TypeScript - types catch bugs immediately
function add(a: number, b: number): number {
  return a + b;
}
add("5", 3); // ❌ Error: "5" is not a number!
```

### What is LSP (Language Server Protocol)?
A helper that runs in the background, reading your code and providing:
- Error detection (red squiggly lines)
- Auto-complete suggestions
- "Go to definition" (jump to where something was created)
- Automatic imports

### What This Plugin Does
Gives Claude the same intelligence that your code editor has. Claude sees type errors in real-time, suggests correct imports, and understands your code structure deeply.

### Example: Without typescript-lsp
```
You: "Add a function to calculate job totals"

Claude: *writes code that might have type errors*
*might import from wrong places*
*you discover bugs later*
```

### Example: With typescript-lsp
```
You: "Add a function to calculate job totals"

Claude: *sees your existing types*
"I see you have a Job type with price: number and quantity: number.
Here's a function that works with your types..."
*writes code that definitely works with your project*
```

### How to Use It
Automatic - just works when you're coding TypeScript/JavaScript.

### Install Command
```bash
claude plugin install typescript-lsp
```

---

## PLUGIN 8: commit-commands
**Installs:** 30,000 | **Recommended:** Helpful

### What is a Commit?
When you save code to Git, you create a "commit" - a snapshot of your code at that moment with a message describing what changed.

Good commit messages help you understand your code history:
- ✅ "Add user authentication with email verification"
- ❌ "fixed stuff"
- ❌ "asdfasdf"

### What This Plugin Does
Streamlines the Git commit process:
- Automatically writes good commit messages based on your changes
- Handles the technical Git commands for you
- Can also push (upload) to GitHub

### Example Use
```
You: /commit

Claude: *looks at what you changed*
"I see you added a new booking form component and updated the database schema.

Suggested commit message:
'Add booking form with date picker and time slots

- Created BookingForm component with validation
- Added bookings table to database schema
- Integrated with existing job system'

Commit and push?"

You: "Yes"

Claude: *commits and pushes to GitHub*
```

### How to Use It
Type `/commit` when you want to save your changes.

### Install Command
```bash
claude plugin install commit-commands
```

---

## PLUGIN 9: playwright ⭐
**Installs:** 28,100 | **Recommended:** YES

### What is End-to-End Testing?
Testing your app the way a real user would:
1. Open the website
2. Click the login button
3. Type email and password
4. Click submit
5. Verify the dashboard appears

Doing this manually every time you change code is exhausting. Playwright automates it.

### What is Playwright?
A tool that controls a real web browser automatically. It can:
- Click buttons
- Fill out forms
- Take screenshots
- Verify text appears on page
- Test on Chrome, Firefox, and Safari

### What This Plugin Does
Connects Claude to Playwright so Claude can:
- Write automated tests for your app
- Actually run those tests
- Take screenshots to show you what happened
- Debug when tests fail

### Example Use
```
You: "Write tests for my login flow"

Claude: "I'll create end-to-end tests for login..."

*Creates tests that:*
1. Open your login page
2. Try logging in with wrong password (should show error)
3. Try logging in with correct password (should go to dashboard)
4. Try accessing protected page without login (should redirect)

You: "Run the tests"

Claude: *actually runs browser automation*
"Results:
✅ Wrong password shows error message
✅ Correct login goes to dashboard
❌ Protected page doesn't redirect - BUG FOUND!
Screenshot attached showing the issue."
```

### How to Use It
Ask Claude to write or run tests:
- "Write tests for the checkout process"
- "Test if the signup form validates emails correctly"

### Install Command
```bash
claude plugin install playwright
```

---

## PLUGIN 10: security-guidance ⭐
**Installs:** 25,500 | **Recommended:** YES

### Why Security Matters
If your app has security holes, hackers can:
- Steal user data (emails, passwords, payment info)
- Delete your database
- Use your app to attack others
- You could be legally liable

### Common Security Mistakes
1. **SQL Injection** - Hackers type code into your search box that runs on your database
2. **XSS (Cross-Site Scripting)** - Hackers inject code that runs in other users' browsers
3. **Exposed API Keys** - Accidentally putting passwords in your code
4. **Missing Authentication** - Forgetting to check if users are logged in

### What This Plugin Does
Acts like a security guard watching your code. When you write something risky, it immediately warns you.

### Example: Without security-guidance
```
You: "Create a search function"

Claude: *writes code with SQL injection vulnerability*
*you don't notice*
*hackers find it later and steal your data*
```

### Example: With security-guidance
```
You: "Create a search function"

Claude: *writes code*
⚠️ SECURITY WARNING: This search implementation is vulnerable
to SQL injection. I'm rewriting it using parameterized queries...

*rewrites code safely*
"Here's the secure version. The user input is now sanitized."
```

### How to Use It
Automatic - warns you whenever you're about to do something risky.

### Install Command
```bash
claude plugin install security-guidance
```

---

## PLUGIN 11: code-simplifier
**Installs:** 25,500 | **Recommended:** Good for cleanup

### The Problem: Complex Code
AI-generated code (and human code) can become messy:
- Functions that are 200 lines long
- Confusing variable names
- Duplicated code everywhere
- Overly complicated logic

### What "Refactoring" Means
Improving code without changing what it does. Like editing a messy essay to be clearer while keeping the same message.

### What This Plugin Does
Analyzes your code and simplifies it:
- Breaks long functions into smaller ones
- Improves variable names
- Removes duplicate code
- Simplifies complex logic

### Example Use
```
You: /simplify src/utils/helpers.js

Claude: "Analyzing helpers.js..."

"Found issues:
1. calculateTotal() is 150 lines - breaking into smaller functions
2. Variable 'x' should be 'itemPrice'
3. Same validation logic repeated 4 times - creating reusable function
4. Nested if-statements can be simplified

Simplified version:
- 150 lines → 45 lines
- 4 functions → 6 smaller, clearer functions
- Added comments for clarity

Show changes?"
```

### How to Use It
Type `/simplify` followed by a file or folder.

### Install Command
```bash
claude plugin install code-simplifier
```

---

## PLUGIN 12: ralph-loop
**Installs:** 22,900 | **Recommended:** Advanced users

### What is an "Iterative Loop"?
Doing something repeatedly, improving each time:
1. Create first draft
2. Review it
3. Improve it
4. Review again
5. Improve again
6. Until it's great

### What This Plugin Does
Creates a self-improving loop where Claude:
1. Creates something
2. Reviews its own work
3. Improves it
4. Reviews again
5. Keeps going until quality is high

### Example Use
```
You: "Create the best possible error handling for my app"

Claude (Loop 1): *creates basic error handling*
Claude (Review): "This doesn't handle network errors well"

Claude (Loop 2): *improves network error handling*
Claude (Review): "Missing user-friendly messages"

Claude (Loop 3): *adds friendly messages*
Claude (Review): "Good. Could add retry logic"

Claude (Loop 4): *adds retry logic*
Claude (Review): "Comprehensive. Stopping here."

"Final result after 4 iterations..."
```

### How to Use It
For tasks where you want Claude to iterate until excellent.

### Install Command
```bash
claude plugin install ralph-loop
```

---

## PLUGIN 13: supabase ✅
**Installs:** 20,900 | **Status:** You already have this via MCP!

### What is Supabase?
An all-in-one backend platform:
- **Database** - Store your data (users, jobs, bookings)
- **Authentication** - Handle logins, signups, passwords
- **Storage** - Store files (images, documents)
- **Real-time** - Instant updates (like chat apps)

Think of it as the "behind the scenes" of your app.

### What This Plugin Does
Connects Claude directly to your Supabase project so Claude can:
- See your actual database tables
- Write queries that work with YOUR data
- Help build features knowing your exact setup

### Example Use
```
You: "Show me my database tables"

Claude: "You have these tables:
- users (id, email, name, created_at)
- jobs (id, user_id, title, status, price)
- bookings (id, job_id, date, time)
- reviews (id, job_id, rating, comment)"

You: "Get all jobs with status 'pending' from the last week"

Claude: *writes exact query for YOUR database*
"Here are the 12 pending jobs from this week..."
```

---

## PLUGIN 14: pr-review-toolkit
**Installs:** 20,100 | **Recommended:** Good addition to code-review

### What is a Pull Request (PR)?
When you want to add your code changes to the main project, you create a "pull request" - it's like saying "please review this and pull it into the main code."

### What This Plugin Does
Reviews PRs from 6 different specialized angles:
1. **Test Coverage** - Are there enough tests?
2. **Error Handling** - What happens when things go wrong?
3. **Type Safety** - Are the data types correct?
4. **Code Quality** - Is the code clean and maintainable?
5. **Comments** - Is confusing code explained?
6. **Performance** - Will this be fast enough?

### Example Use
```
You: /pr-review

Claude: "Running 6-pass review on PR #45..."

TEST COVERAGE: ⚠️ New booking function has no tests
ERROR HANDLING: ✅ Errors are caught and logged
TYPE SAFETY: ✅ All types are correct
CODE QUALITY: ⚠️ Function is 80 lines, consider splitting
COMMENTS: ❌ Complex algorithm on line 45 needs explanation
PERFORMANCE: ✅ Database queries are optimized

"3 issues to address before merging."
```

### Install Command
```bash
claude plugin install pr-review-toolkit
```

---

## PLUGIN 15: agent-sdk-dev 🔧
**Installs:** 18,200 | **Recommended:** NO (for developers building AI tools)

### What is an Agent?
An AI "agent" is an AI that can take actions, not just answer questions. Claude Code is an agent - it can edit files, run commands, etc.

### What is an SDK?
Software Development Kit - tools for building software.

### What This Plugin Does
Provides tools for developers who want to BUILD their own AI agents (like building another Claude).

### Should You Install It?
NO - This is for people building AI products, not using them.

---

## PLUGIN 16: figma ⭐
**Installs:** 18,100 | **Recommended:** YES if you use Figma

### What is Figma?
A design tool where designers create app mockups - what the app should look like. Like Photoshop but specifically for app/website design.

### What This Plugin Does
Connects Claude to your Figma files so Claude can:
- SEE your designs
- Convert designs directly to code
- Match colors, spacing, and fonts exactly

### Example Use
```
You: "Convert this Figma design to React"
*shares Figma link*

Claude: *reads the Figma file*
"I can see a dashboard with:
- Header with logo and navigation
- Sidebar with menu items
- Main content area with cards
- Chart component

Converting to React components..."

*creates code that looks EXACTLY like the design*
```

### How to Use It
Share Figma links or file IDs with Claude.

### Install Command
```bash
claude plugin install figma
```

---

## PLUGIN 17: pyright-lsp 📝
**Installs:** 17,800 | **Recommended:** Only if using Python

### What is Python?
A popular programming language known for being readable and versatile. Used for web backends, data science, AI, automation.

### What is Pyright?
A type checker for Python - catches errors before you run your code.

### What This Plugin Does
Same as typescript-lsp but for Python. Gives Claude real-time understanding of your Python code.

### Should You Install It?
Only if your app uses Python.

### Install Command
```bash
claude plugin install pyright-lsp
```

---

## PLUGIN 18: atlassian
**Installs:** 17,800 | **Recommended:** Only if using Jira/Confluence

### What is Atlassian?
A company that makes project management tools:
- **Jira** - Track bugs and tasks (popular with big companies)
- **Confluence** - Team documentation wiki

### What This Plugin Does
Connects Claude to your Atlassian account to:
- Create and update Jira tickets
- Read Confluence documentation
- Link code changes to tickets

### Example Use
```
You: "Create a Jira ticket for the payment bug we discussed"

Claude: *creates ticket*
"Created BLUE-234: Payment processing fails for amounts over $1000
- Priority: High
- Assigned to: You
- Sprint: Current"
```

### Should You Install It?
Only if you use Jira or Confluence.

### Install Command
```bash
claude plugin install atlassian
```

---

## PLUGIN 19: explanatory-output-style
**Installs:** 12,300 | **Recommended:** Great for learning

### What This Plugin Does
Makes Claude explain WHY it's doing things, not just doing them. Turns every interaction into a learning opportunity.

### Example: Without this plugin
```
You: "Fix the login bug"

Claude: *fixes the bug*
"Done. The login should work now."
```

### Example: With this plugin
```
You: "Fix the login bug"

Claude: *fixes the bug*
"Done. Here's what I did and why:

The bug was caused by an async/await issue. When a user
clicked login, we weren't waiting for the database response
before checking the password.

I added 'await' before the database call. This tells
JavaScript to wait for the response before continuing.

This is a common mistake called a 'race condition' -
where code runs in the wrong order. Always use await
with database calls!

The login should work now."
```

### How to Use It
Automatic - Claude explains more after installation.

### Install Command
```bash
claude plugin install explanatory-output-style
```

---

## PLUGIN 20: plugin-dev 🔧
**Installs:** 11,600 | **Recommended:** NO (for plugin developers)

### What This Plugin Does
Tools for creating your own Claude Code plugins.

### Should You Install It?
NO - Only for developers building plugins.

---

## PLUGIN 21: notion
**Installs:** 11,000 | **Recommended:** Only if using Notion

### What is Notion?
A flexible workspace app for notes, databases, wikis, and project management. Many startups use it for documentation.

### What This Plugin Does
Connects Claude to your Notion workspace to:
- Search your notes and docs
- Create new pages
- Update databases

### Example Use
```
You: "Find the product requirements doc in Notion"

Claude: *searches Notion*
"Found 'Blue Tradie Product Requirements' updated 3 days ago.
Key features listed:
1. Job booking system
2. Tradie availability calendar
3. Customer reviews..."
```

### Install Command
```bash
claude plugin install notion
```

---

## PLUGIN 22: greptile
**Installs:** 10,500 | **Recommended:** Good for large codebases

### What is "Grep"?
A command that searches for text in files. "Greptile" is an AI-powered version.

### What This Plugin Does
Searches your entire codebase using natural language instead of exact text matching.

### Example: Regular Search vs Greptile
```
Regular search for "authentication":
- Finds files containing the word "authentication"

Greptile search for "authentication":
- Finds "authentication"
- Also finds "login", "signIn", "verifyUser", "checkPassword"
- Understands you want auth-related code
```

### Example Use
```
You: "Where do I handle payment processing?"

Greptile: "Payment processing is handled in:
- /src/services/stripe.ts - Main Stripe integration
- /src/api/payments.js - Payment API endpoints
- /src/hooks/usePayment.ts - Frontend payment hook
- /src/utils/pricing.ts - Price calculations"
```

### Install Command
```bash
claude plugin install greptile
```

---

## PLUGIN 23: hookify 🔧
**Installs:** 10,000 | **Recommended:** Advanced users only

### What is a Hook (in Claude Code)?
An automatic action that runs when something happens:
- "When I commit code, automatically run tests"
- "When I save a file, automatically format it"
- "When I write SQL, automatically check for injection"

### What This Plugin Does
Makes it easy to create custom hooks without writing complex code.

### Example Use
```
You: "Create a hook that runs tests before every commit"

Hookify: *creates the hook*
"Done. Now every time you commit:
1. Tests will run automatically
2. If tests fail, commit is blocked
3. You'll see which tests failed"
```

### Should You Install It?
Not essential for beginners. Nice for automation later.

### Install Command
```bash
claude plugin install hookify
```

---

## PLUGIN 24: linear
**Installs:** 9,500 | **Recommended:** Only if using Linear

### What is Linear?
A modern issue tracker (like Jira, but simpler and faster). Popular with startups for managing tasks and bugs.

### What This Plugin Does
Connects Claude to Linear to:
- Create issues
- Update task status
- Search projects

### Example Use
```
You: "Create a Linear issue for adding dark mode"

Claude: *creates issue*
"Created BLU-89: Add dark mode support
- Status: Backlog
- Priority: Medium
- Labels: feature, frontend"
```

### Install Command
```bash
claude plugin install linear
```

---

## PLUGIN 25: learning-output-style
**Installs:** 8,300 | **Recommended:** If you want to learn

### What This Plugin Does
Instead of just giving you code, Claude asks YOU to think about it first. Like a teacher who asks questions instead of giving answers.

### Example: Without this plugin
```
You: "How do I add a search function?"

Claude: "Here's the code..."
*gives you the answer*
```

### Example: With this plugin
```
You: "How do I add a search function?"

Claude: "Good question! Before I show you, let me ask:
1. What data are you searching through?
2. Do you need to search as the user types, or on button click?
3. Should it be case-sensitive?

Think about these, then I'll help you build it properly."

You: "Searching jobs, as user types, not case sensitive"

Claude: "Great thinking! Now, what approach would you try first?
a) Filter the existing list in memory
b) Make a database query each time
c) Use a search index

Hint: Consider how many jobs you'll have."
```

### Install Command
```bash
claude plugin install learning-output-style
```

---

## PLUGIN 26: vercel
**Installs:** 7,700 | **Recommended:** If using Vercel for hosting

### What is Vercel?
A platform for deploying (putting on the internet) web applications. Very popular for React/Next.js apps. Makes deployment easy - just push code and it goes live.

### What This Plugin Does
Connects Claude to Vercel to:
- Deploy your app
- Check deployment status
- Roll back to previous versions
- Manage environment variables

### Example Use
```
You: "Deploy my app to production"

Claude: *triggers Vercel deployment*
"Deployment started.
Building... ✅
Testing... ✅
Deploying... ✅

Live at: https://blue-tradie.vercel.app
Deployment took 45 seconds."
```

### Install Command
```bash
claude plugin install vercel
```

---

## PLUGIN 27: sentry ⭐
**Installs:** 7,400 | **Recommended:** YES for production apps

### What is Sentry?
An error monitoring service. When your app crashes for a user, Sentry:
- Captures the error
- Shows you exactly what happened
- Tells you which code caused it
- Shows how many users were affected

### Why You Need It
Without Sentry: Users see errors, leave your app, you never know why.
With Sentry: You get notified instantly, see the exact problem, fix it fast.

### What This Plugin Does
Connects Claude to Sentry so Claude can:
- See what errors are happening in production
- Help debug real issues
- Understand patterns in your bugs

### Example Use
```
You: "What errors happened today?"

Claude: *checks Sentry*
"Today's errors:
1. TypeError in checkout.js (line 45) - 23 users affected
   'Cannot read property price of undefined'
   Happening when cart is empty

2. NetworkError in api.js - 5 users affected
   Timeout connecting to payment processor

Should I fix the checkout bug first?"
```

### Install Command
```bash
claude plugin install sentry
```

---

## PLUGIN 28: laravel-boost 📝
**Installs:** 6,900 | **Recommended:** Only if using Laravel

### What is Laravel?
A popular PHP framework for building web applications. Known for elegant syntax and lots of built-in features.

### What This Plugin Does
Makes Claude an expert in Laravel:
- Artisan commands (Laravel's command-line tools)
- Eloquent ORM (Laravel's database system)
- Laravel best practices

### Should You Install It?
Only if your app is built with Laravel/PHP.

### Install Command
```bash
claude plugin install laravel-boost
```

---

## PLUGIN 29: gopls-lsp 📝
**Installs:** 6,700 | **Recommended:** Only if using Go

### What is Go?
A programming language made by Google. Known for being fast and good for building servers and APIs.

### What This Plugin Does
Gives Claude real-time Go code intelligence.

### Should You Install It?
Only if your app uses Go.

### Install Command
```bash
claude plugin install gopls-lsp
```

---

## PLUGIN 30: slack
**Installs:** 6,600 | **Recommended:** If using Slack for team communication

### What is Slack?
A messaging app for teams. Like Discord or Teams but focused on work. Channels for different topics, direct messages, file sharing.

### What This Plugin Does
Connects Claude to Slack to:
- Search message history
- Find past discussions
- Access shared knowledge

### Example Use
```
You: "Find the Slack discussion about the pricing changes"

Claude: *searches Slack*
"Found in #product channel from 2 weeks ago:
- Team decided on 3 pricing tiers
- Free: 5 jobs/month
- Pro: $29/month unlimited
- Enterprise: Custom pricing
Link to thread: ..."
```

### Install Command
```bash
claude plugin install slack
```

---

## PLUGIN 31: gitlab
**Installs:** 6,100 | **Recommended:** Only if using GitLab

### What is GitLab?
Like GitHub - a place to store code with version control. Some companies use GitLab instead of GitHub.

### What This Plugin Does
Same as the GitHub plugin but for GitLab users.

### Should You Install It?
NO - You use GitHub.

---

## PLUGIN 32: csharp-lsp 📝
**Installs:** 6,000 | **Recommended:** Only if using C#

### What is C#?
A programming language made by Microsoft. Used for Windows apps, games (Unity), and web backends (.NET).

### What This Plugin Does
Gives Claude real-time C# code intelligence.

### Should You Install It?
Only if your app uses C#.

---

## PLUGIN 33: rust-analyzer-lsp 📝
**Installs:** 5,800 | **Recommended:** Only if using Rust

### What is Rust?
A programming language focused on speed and safety. Popular for systems programming where performance matters.

### What This Plugin Does
Gives Claude real-time Rust code intelligence.

### Should You Install It?
Only if your app uses Rust.

---

## PLUGIN 34: stripe ⭐
**Installs:** 5,200 | **Recommended:** YES when adding payments

### What is Stripe?
The most popular payment processing platform for online businesses. Handles:
- Credit card payments
- Subscriptions (monthly billing)
- Invoices
- Refunds

### What This Plugin Does
Connects Claude to your Stripe account so Claude can:
- Understand your payment setup
- Help build subscription systems
- Debug payment issues
- Write webhook handlers (code that runs when payments happen)

### Example Use
```
You: "Help me create a $29/month subscription"

Claude: *sees your Stripe setup*
"I see you have Stripe connected. Here's what I'll create:
1. A product called 'Blue Tradie Pro'
2. A price of $29/month recurring
3. A checkout page
4. Webhook handlers for:
   - Successful payments
   - Failed payments
   - Subscription cancellations

Creating now..."
```

### Install Command
```bash
claude plugin install stripe
```

---

## PLUGINS 35-40: Language LSPs 📝
(php-lsp, jdtls-lsp, clangd-lsp, swift-lsp, lua-lsp, kotlin-lsp)

### What These Do
Same as typescript-lsp but for other languages:
- **php-lsp** - PHP language support
- **jdtls-lsp** - Java language support
- **clangd-lsp** - C/C++ language support
- **swift-lsp** - Swift (iOS) language support
- **lua-lsp** - Lua (games) language support
- **kotlin-lsp** - Kotlin (Android) language support

### Should You Install Any?
Only install the one matching your app's language.

---

## PLUGIN 41: firebase
**Installs:** 4,100 | **Recommended:** NO (you use Supabase)

### What is Firebase?
Google's version of Supabase - database, auth, storage, hosting.

### Should You Install It?
NO - You're already using Supabase, which does the same thing.

---

## PLUGIN 42: huggingface-skills
**Installs:** 2,200 | **Recommended:** Only if building AI features

### What is Hugging Face?
A platform with thousands of free AI models:
- Image generation
- Text analysis
- Translation
- Speech recognition

### What This Plugin Does
Connects Claude to Hugging Face so you can use AI models in your app.

### Example Use
```
You: "Add AI that describes uploaded images"

Claude: *uses Hugging Face model*
"I'll use the BLIP image captioning model. When a tradie
uploads a job photo, it will automatically generate
descriptions like 'A damaged water pipe under a sink.'"
```

### Should You Install It?
Only if you want AI features (image recognition, etc.)

### Install Command
```bash
claude plugin install huggingface-skills
```

---

## PLUGIN 43: asana
**Installs:** 1,700 | **Recommended:** Only if using Asana

### What is Asana?
A project management tool like Jira or Linear but with a different interface.

### What This Plugin Does
Connects Claude to Asana for task management.

### Should You Install It?
Only if you use Asana.

---

## PLUGIN 44: pinecone
**Installs:** 668 | **Recommended:** Advanced AI features only

### What is a Vector Database?
A special database that finds SIMILAR things, not exact matches:
- Normal database: "Find user with email john@email.com"
- Vector database: "Find products similar to this one"

Pinecone is the most popular vector database.

### What This Plugin Does
Connects Claude to Pinecone for AI-powered similarity search.

### Example Use Case
"Show me jobs similar to this one" - finds jobs with similar descriptions, locations, or skills needed.

### Should You Install It?
Only if building advanced AI search features.

---

## PLUGIN 45: circleback
**Installs:** 286 | **Recommended:** Only if using Circleback

### What is Circleback?
A meeting note and conversation tool.

### What This Plugin Does
Accesses meeting notes and conversation history.

### Should You Install It?
Only if you use Circleback.

---

## PLUGIN 46: superpowers
**Installs:** 0 (New!) | **Recommended:** Experimental

### What This Plugin Does
Teaches Claude advanced problem-solving:
- Brainstorming techniques
- Breaking complex problems into sub-tasks
- Using multiple "sub-agents" for different aspects

### Should You Install It?
It's brand new and experimental. Try it if you're curious!

### Install Command
```bash
claude plugin install superpowers
```

---

# YOUR INSTALLATION CHECKLIST

## Install Now (Essential for Blue Tradie)
```bash
claude plugin install frontend-design
claude plugin install security-guidance
claude plugin install typescript-lsp
claude plugin install code-review
claude plugin install feature-dev
```

## Install Soon (Highly Recommended)
```bash
claude plugin install playwright
claude plugin install commit-commands
claude plugin install code-simplifier
```

## Install When Needed
```bash
claude plugin install stripe          # When adding payments
claude plugin install sentry          # When going to production
claude plugin install figma           # If you use Figma
claude plugin install vercel          # If you deploy on Vercel
claude plugin install explanatory-output-style  # If you want to learn
```

## Already Set Up ✅
- context7 (via MCP)
- supabase (via MCP)
- GitHub code reviewer (via GitHub Actions)

## Don't Need
- All language LSPs except typescript-lsp
- plugin-dev, hookify, agent-sdk-dev (developer tools)
- gitlab, firebase (you use GitHub and Supabase)
- atlassian, linear, asana, slack, notion (unless you use these)
