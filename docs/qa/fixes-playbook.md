# Successful Fixes Playbook

**Purpose:** Document proven debugging workflows and successful fixes to resolve future bugs faster.

---

## Troubleshooting Order of Operations

When debugging production issues, follow this checklist BEFORE writing code:

1. **Check if this is caching/service worker**
   - Try: DevTools → Application → Service Workers → "Bypass for network" → Refresh
   - Try: Unregister service worker + Clear site data → Refresh
   - Check if behavior becomes consistent after bypass/unregister

2. **Check Network tab for Document vs SPA navigation**
   - Document request = server-side navigation (full page load from Express)
   - XHR/Fetch request = client-side navigation (SPA router or API call)
   - Type mismatch indicates routing layer confusion (client router vs server routing)

3. **Confirm server logs show expected route handlers**
   - Check Render logs for route-specific log statements (e.g., `[LOGIN] Serving login page`, `[VERIFY] About to save session`)
   - If logs don't appear, the route isn't being hit (middleware blocking, wrong path, etc.)
   - If logs show unexpected values, trace where those values are set

4. **Confirm the deployed commit SHA matches expected fix**
   - Run: `git rev-parse HEAD` locally
   - Check Render deploy logs for deployed commit SHA
   - If mismatch: your fix isn't deployed yet (push failed, wrong branch, build failed)

5. **Confirm client routes match server redirects**
   - Server redirect destinations must match actual client-side route paths
   - Example: Server redirects to `/dashboard` but client route is at `/` → blank screen
   - Check both SPA router config (App.tsx) and all server redirect logic

6. **Search ALL instances of problematic values**
   - Use ripgrep to find EVERY hardcoded path/value (e.g., `rg -n '"/dashboard"' server`)
   - Don't assume one fix is enough - there may be multiple code paths

---

## Fix #1: Homepage Login Button → 404

### Symptom
- User clicks "Login" button from marketing homepage (https://bluetradie.com)
- URL changes to `https://bluetradie.com/login`
- Instead of login page, shows client-side NotFound component ("Did you forget to add the page to the router?")
- Refreshing on `/login` works correctly and shows login page

### Root Cause
- **Client-side SPA navigation** attempted to route `/login` through React router
- `/login` is NOT a client-side route - it's a **server-rendered page** served by Express
- Login button used `setLocation('/login')` (Wouter SPA navigation) instead of hard navigation
- Service worker caching made behavior inconsistent (sometimes worked, sometimes didn't)

### How We Proved It
1. **Network tab evidence:**
   - Clicking Login did NOT create a Document request to `/login`
   - No Express 404 in Render logs (confirming it never hit the server)
   - URL changed but page content came from client-side router

2. **DevTools Service Worker:**
   - "Bypass for network" made login more reliable → proved SW involvement
   - But even after unregistering SW, still failed → proved root cause was navigation method

3. **Code inspection:**
   - `landing.tsx:42-44` had `setLocation('/login')` (client-side navigation)
   - `App.tsx` router had NO `/login` route defined
   - Wouter returned `null` for unmatched routes → blank/NotFound

### Minimal Code Change
**File:** `client/src/pages/landing.tsx`

**Lines:** 42-44

**Change:**
```typescript
// Before:
const handleLogin = () => {
  setLocation('/login');
};

// After:
const handleLogin = () => {
  window.location.href = '/login';
};
```

**Why this works:** Forces browser to make a real HTTP request to Express, which serves the login page.

### Deployment Gotchas
- First commit wasn't pushed to GitHub (local only) → fix didn't deploy
- Had to confirm with `git status` that branch was ahead and needed push
- Service worker made manual testing inconsistent until bypassed

### Verification Checklist (Production)
- [ ] Click "Login" from homepage → Network tab shows **Document request** to `/login` (not SPA navigation)
- [ ] Render logs show: `[LOGIN] Serving login page`
- [ ] Login page renders immediately (no NotFound component)
- [ ] URL is `https://bluetradie.com/login`
- [ ] No service worker bypass needed for consistent behavior

**Commit:** `dbdf792`

---

## Fix #2: Magic Link Works But Dashboard Shows Blank Page

### Symptom
- User successfully authenticates via magic link
- `/auth/verify` succeeds and sets session
- GET `/api/auth/user` returns 200 with userId/email
- useAuth shows `hasUser: true, isLoading: false`
- BUT dashboard page is blank - only floating UI renders (quick actions, AI assistant, footer)
- Main content area (child 0 of `#root`) is empty `<div></div>`

### Root Cause (Multiple Layers)

**Layer 1: Password Gate Middleware**
- Password gate checked ONLY `session.passwordAuthenticated` flag
- Magic link auth sets `session.userId`, NOT `passwordAuthenticated`
- Authenticated users were redirected to password gate HTML page
- SPA tried to parse HTML as JSON → failed

**Layer 2: Route Mismatch**
- Server redirected to `/dashboard` after magic link verify
- Client Dashboard route mounted at `/` (root), NOT `/dashboard`
- Wouter router couldn't match `/dashboard` → rendered `null` (empty DIV)

**Layer 3: Hardcoded Redirects Everywhere**
- Multiple code paths hardcoded `/dashboard`:
  - `server/routes/auth-verify.ts` (magic link verify)
  - `server/routes.ts` (magic link token creation - embedded in JWT!)
  - `server/index.ts` (/login redirect for authenticated users)
  - `server/services/auth-service.ts` (default redirect parameter)
  - `server/routes/onboarding.ts` (onboarding completion)

### How We Proved It

1. **DevTools DOM inspection:**
   ```javascript
   document.getElementById("root").childElementCount  // = 5
   root.children[0].childElementCount  // = 0 (empty!)
   root.innerText  // Only showed global UI text, no dashboard content
   ```

2. **Network tab evidence:**
   - Request named "password-gate"
   - Response was HTML (not JSON)
   - Response preview showed full "Coming Soon" password gate page

3. **Server logs evidence:**
   ```
   [VERIFY] About to save session before redirect: ... redirectTo: '/dashboard'
   [VERIFY] ✅ Session saved successfully, redirecting: ... redirect: '/dashboard'
   ```
   Proved server was redirecting to non-existent route.

4. **Code search evidence:**
   ```bash
   rg -n '"/dashboard"' server
   # Found 5+ instances across multiple files
   ```

5. **Client router inspection:**
   ```typescript
   // App.tsx:142
   <Route path="/" component={Dashboard} />
   // No <Route path="/dashboard"> existed!
   ```

### Minimal Code Changes

**Fix 1: Password Gate (Allow Magic Link Auth)**

**File:** `server/middleware/password-gate.ts`

**Line:** 38-40

**Change:**
```typescript
// Before:
if (req.session?.passwordAuthenticated) {
  return next();
}

// After:
if (req.session?.passwordAuthenticated || req.session?.userId) {
  return next();
}
```

**Fix 2: Unify All Redirects to Canonical Route**

**Files & Changes:**

1. `server/routes/auth-verify.ts:8,83`
   ```typescript
   - "/dashboard?fresh=1"
   + "/?fresh=1"
   ```

2. `server/routes.ts:202`
   ```typescript
   - const redirect = user.isOnboarded ? '/dashboard' : '/onboarding';
   + const redirect = user.isOnboarded ? '/' : '/onboarding';
   ```

3. `server/index.ts:149`
   ```typescript
   - return res.redirect(sess.isOnboarded ? '/dashboard' : '/onboarding');
   + return res.redirect(sess.isOnboarded ? '/' : '/onboarding');
   ```

4. `server/services/auth-service.ts:73`
   ```typescript
   - redirect: string = '/dashboard'
   + redirect: string = '/'
   ```

5. `server/routes/onboarding.ts:5,61,66` (centralized with constant)
   ```typescript
   + const APP_HOME_PATH = "/";

   - redirect: "/dashboard"
   + redirect: APP_HOME_PATH
   ```

**Fix 3: Client-Side Safeguard (Prevent Future Blanks)**

**File:** `client/src/App.tsx`

**Line:** 143

**Change:**
```typescript
<Route path="/" component={Dashboard} />
+ <Route path="/dashboard" component={Dashboard} />  // Alias for legacy links
```

**Why this works:**
- Password gate now recognizes both auth methods
- All server code redirects to actual client route (`/`)
- Client has alias so `/dashboard` works if it ever gets used
- Centralized constant prevents future drift

### Deployment Gotchas

1. **Initial fix bypassed by JWT payload:**
   - First fix only changed auth-verify.ts defaults
   - But `routes.ts` embedded `/dashboard` in JWT token payload
   - `payload.redirect` took precedence over defaults → fix bypassed
   - Needed to find ALL redirect sources via comprehensive search

2. **Multiple commits needed:**
   - Fix evolved as we discovered more hardcoded instances
   - Final fix required 5+ commits to cover all code paths

3. **Service worker not the issue:**
   - Initial suspicion was SW caching
   - But blank screen persisted even after SW bypass → confirmed routing issue

### Verification Checklist (Production)

**Magic Link Flow:**
- [ ] Request magic link from `/login`
- [ ] Server logs show token creation: `redirect = '/'` (NOT `/dashboard`)
- [ ] Click magic link
- [ ] Server logs show verify:
  ```
  [VERIFY] About to save session before redirect: { ... redirectTo: '/' }
  [VERIFY] ✅ Session saved successfully, redirecting: { ... redirect: '/' }
  ```
- [ ] Browser lands at `https://bluetradie.com/` (NOT `/dashboard`)
- [ ] Dashboard content renders immediately (jobs, invoices, quotes cards visible)
- [ ] DevTools: `document.getElementById("root").children[0].childElementCount > 0`

**Onboarding Flow:**
- [ ] Complete onboarding
- [ ] API response contains `{ redirect: "/" }` (NOT `/dashboard`)
- [ ] Browser navigates to `/` and dashboard renders

**Legacy Link Protection:**
- [ ] Visit `https://bluetradie.com/dashboard` directly
- [ ] Dashboard renders (NOT blank screen)
- [ ] Client-side alias handles the route

**API Calls Succeed:**
- [ ] After login, Network tab shows successful API calls:
  - GET `/api/auth/user` → 200
  - GET `/api/dashboard` → 200 or 304
  - GET `/api/invoices` → 200 or 304
  - No `password-gate` HTML responses

**Commits:** `f5ef52b` (password gate), `624c1d5` (auth-verify), `a3e6fce` (comprehensive), `17127aa` (onboarding)

---

## Common Anti-Patterns to Avoid

1. **Creating new pages/routes before confirming existing ones don't work**
   - Always search for existing implementations first
   - Check if route exists but is blocked/misconfigured
   - Creating duplicates adds tech debt

2. **Fixing one instance without searching for all instances**
   - Use `rg -n "pattern" path` to find ALL occurrences
   - Hardcoded values often exist in multiple code paths
   - One fix can be bypassed by another code path

3. **Assuming first fix deployed correctly**
   - Always verify with `git status` and `git log`
   - Check Render logs for deployed commit SHA
   - Don't trust that "it should be deployed" - verify

4. **Treating symptoms instead of root causes**
   - Blank screen → "add more error handling" ❌
   - Blank screen → "find why router returns null" ✅
   - Always trace back to the actual cause

5. **Not checking service worker/caching first**
   - Modern SPAs have aggressive caching
   - Service worker can serve stale code even after deploy
   - Always test with SW bypass before assuming code issue

---

## Next Steps After This Playbook

When encountering new bugs:
1. Follow "Troubleshooting Order of Operations" checklist above
2. Document successful fixes in this playbook using the same structure
3. Update anti-patterns if new ones are discovered
4. Keep playbook concise - only proven solutions, not speculation
