# Code Infrastructure Review Prompt

Copy and paste this into your other Claude Code session:

---

## The Prompt

```
I need you to do a thorough, honest code infrastructure review of this project. This app was built with AI assistance ("vibe coding") and I want to know if the codebase is legitimate or if there are serious issues that need fixing.

Please be brutally honest - I'd rather know the truth now than have problems later.

Review the following areas:

## 1. Project Structure
- Is the folder structure logical and maintainable?
- Are files organized properly?
- Is there dead code or unused files?

## 2. Code Quality
- Is the code readable and well-organized?
- Are there code smells (duplicated code, overly complex functions, etc.)?
- Is there proper error handling?
- Are there any obvious bugs?

## 3. Security Issues
- Are there exposed API keys or secrets?
- Is user input validated?
- Are there SQL injection or XSS vulnerabilities?
- Is authentication implemented correctly?

## 4. Database Design
- Is the schema well-designed?
- Are there proper indexes?
- Are relationships correct?
- Is there data validation?

## 5. Performance Concerns
- Are there N+1 query problems?
- Is there unnecessary re-rendering (if React)?
- Are there memory leaks?
- Is caching used appropriately?

## 6. Technical Debt
- Are there TODO comments that were never addressed?
- Are dependencies up to date?
- Is there commented-out code that should be removed?
- Are there inconsistent patterns across the codebase?

## 7. Testing
- Are there any tests?
- Is test coverage adequate?
- Are edge cases handled?

## 8. Scalability
- Will this code work with more users?
- Are there bottlenecks?

---

After reviewing, give me:
1. A letter grade (A-F) for the overall codebase
2. Top 5 critical issues that need immediate attention
3. Top 5 improvements that would make the biggest impact
4. An honest assessment: "Would a senior developer approve this codebase?"

Start by exploring the project structure, then dive into the code.
```

---

## How to Use This

1. Open your other Claude Code session
2. Make sure you're in the `blue-tradie` folder (run `cd C:\Users\ckhen\blue-tradie`)
3. Paste the prompt above
4. Let Claude do its review

---

## Follow-Up Prompts

After the initial review, you can ask:

**For specific fixes:**
```
Fix the top 3 critical issues you identified
```

**For security audit:**
```
ultrathink: Do a deep security audit of the authentication and authorization code
```

**For database review:**
```
Review my Supabase database schema and suggest improvements
```

**For code cleanup:**
```
Identify and remove all dead code and unused imports
```
