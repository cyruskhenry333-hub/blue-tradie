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

## Fix #3: NZ Market Lock + Copy Sweep + AU Leakage Prevention

### Symptom
- With `APP_MARKET_LOCK=NZ` set in production environment
- Signup/trial page still shows "AU Australia" as default country
- Service area placeholder shows "Sydney, NSW" (Australia-specific)
- Quick Access Panel shows "Tax & BAS" (BAS is Australia-specific, should be "GST Returns" for NZ)
- No prevention mechanism to catch new AU-specific strings introduced in future code

### Root Cause
**Primary Issues:**
1. **signup.tsx doesn't use market-config** - Trial/checkout entry point had hardcoded:
   - Schema: `z.enum(["Australia", "New Zealand"])` instead of using `getAllowedCountries()`
   - Default: `country: "Australia"` instead of `getDefaultCountry()`
   - Placeholder: `"Sydney, NSW"` instead of market-appropriate example

2. **Scattered market-specific copy** - No single source of truth for:
   - Service area placeholders (different examples for NZ vs AU)
   - Business ID labels (NZBN vs ABN)
   - Tax authority names (IRD vs ATO)
   - Tax forms (GST Returns vs BAS)
   - Currency codes (NZD vs AUD)

3. **No leakage prevention** - Easy to accidentally hardcode AU-specific strings anywhere in codebase

### How We Proved It
1. **User evidence:**
   - "Create Your Account / Start Free Trial" screen showed AU default and Sydney placeholder
   - This was happening despite `APP_MARKET_LOCK=NZ` being set in Render

2. **Code search evidence:**
   ```bash
   rg -n "Sydney|NSW" client/src
   # Found 12 instances across signup.tsx, jobs.tsx, profile.tsx, etc.

   rg -n "ABN|ATO|BAS" client/src
   # Found 40+ instances scattered across components
   ```

3. **File inspection:**
   - `signup.tsx:24` - Hardcoded enum
   - `signup.tsx:55` - Default "Australia"
   - `signup.tsx:300` - Placeholder "Sydney, NSW"
   - `QuickAccessPanel.tsx:122` - "Tax & BAS" hardcoded

### Minimal Code Changes

**Fix 1: Extend market-config.ts with Market-Specific Helpers**

**File:** `shared/market-config.ts`

**Added Functions:**
```typescript
export function getServiceAreaPlaceholder(): string {
  const defaultCountry = getDefaultCountry();
  if (defaultCountry === 'New Zealand') {
    return 'e.g., Auckland Central, Wellington';
  }
  if (defaultCountry === 'Australia') {
    return 'e.g., Sydney Metro, Melbourne CBD';
  }
  return 'e.g., Sydney Metro, Auckland Central'; // Both allowed
}

export function getDefaultCurrency(): string {
  const defaultCountry = getDefaultCountry();
  return defaultCountry === 'New Zealand' ? 'NZD' : 'AUD';
}

export function getBusinessIdLabel(): string {
  const defaultCountry = getDefaultCountry();
  return defaultCountry === 'New Zealand' ? 'NZBN' : 'ABN';
}

export function getTaxAuthority(): string {
  const defaultCountry = getDefaultCountry();
  return defaultCountry === 'New Zealand' ? 'IRD' : 'ATO';
}

export function getTaxFormsLabel(): string {
  const defaultCountry = getDefaultCountry();
  return defaultCountry === 'New Zealand' ? 'GST Returns' : 'BAS';
}

export function getGSTRate(): string {
  const defaultCountry = getDefaultCountry();
  return defaultCountry === 'New Zealand' ? '15%' : '10%';
}
```

**Why this works:**
- Single source of truth for all market-specific UI defaults
- Automatically adapts based on `APP_MARKET_LOCK` environment variable
- When `MARKET_LOCK=NZ`, all functions return NZ-appropriate values
- When `MARKET_LOCK=AU`, all return AU values
- When both allowed, returns neutral/dual examples

**Fix 2: Update signup.tsx to Use Market Config**

**File:** `client/src/pages/signup.tsx`

**Changes:**
```typescript
// Added import:
import { getAllowedCountries, getDefaultCountry, getServiceAreaPlaceholder } from "@shared/market-config";

// Line 25 - Schema:
- country: z.enum(["Australia", "New Zealand"], ...)
+ country: z.enum(getAllowedCountries() as [string, ...string[]], ...)

// Line 56 - Default value:
- country: "Australia",
+ country: getDefaultCountry(),

// Line 271-298 - Country selector (conditionally hide when only 1 option):
+ {getAllowedCountries().length > 1 ? (
    <FormField ... country selector ... />
+ ) : (
+   <input type="hidden" {...form.register("country")} value={getDefaultCountry()} />
+ )}

// Line 308 - Service area placeholder:
- <Input placeholder="Sydney, NSW" {...field} />
+ <Input placeholder={getServiceAreaPlaceholder()} {...field} />
```

**Fix 3: Update onboarding-wizard.tsx**

**File:** `client/src/components/onboarding-wizard.tsx`

**Change:**
```typescript
// Already had market-config import, just updated placeholder:
- <Input placeholder="e.g., Sydney Metro, Auckland Central" {...field} />
+ <Input placeholder={getServiceAreaPlaceholder()} {...field} />
```

**Fix 4: Update profile.tsx**

**File:** `client/src/pages/profile.tsx`

**Changes:**
```typescript
// Added import:
+ import { getServiceAreaPlaceholder } from "@shared/market-config";

// Line 280 - Placeholder:
- <Input placeholder="e.g., Sydney Metro, Auckland Central" {...field} />
+ <Input placeholder={getServiceAreaPlaceholder()} {...field} />
```

**Fix 5: Update QuickAccessPanel.tsx**

**File:** `client/src/components/QuickAccessPanel.tsx`

**Changes:**
```typescript
// Added import:
+ import { getTaxFormsLabel } from "@shared/market-config";

// Line 123 - Dynamic title:
- title: "Tax & BAS",
+ title: `Tax & ${getTaxFormsLabel()}`,
```

**Fix 6: Prevention Script**

**File:** `scripts/check-market-leakage.cjs` (new file)

**Added npm script:**
```json
// package.json:
"lint:market": "node scripts/check-market-leakage.cjs"
```

**How it works:**
- Scans `client/src`, `server`, `shared` for forbidden tokens:
  - Sydney, NSW, Melbourne, ABN, ATO, BAS, "AUD", "AU Australia"
- Allows these tokens ONLY in:
  - `shared/market-config.ts`
  - `client/src/utils/language-utils.ts`
  - `shared/schema.ts` (DB schema country enum)
  - Documentation files
  - Migrations (historical data)
- Fails with exit code 1 if violations found outside allowed locations
- Can be added to CI pipeline later

### Deployment Gotchas
1. **Env var must be set in Render:**
   - Code is ready, but activation requires manual env var: `APP_MARKET_LOCK=NZ`
   - After setting, service auto-redeploys and NZ-only mode activates

2. **Client-side cache:**
   - Users may have cached old signup page with AU defaults
   - Service worker cache should auto-update on deploy
   - If issues persist, clear browser cache or hard refresh

### Verification Checklist (Production)

**With `APP_MARKET_LOCK=NZ` set:**

**Signup/Trial Page (`/signup`):**
- [ ] Country selector is hidden (not visible in form)
- [ ] Form defaults to "New Zealand" (check hidden input value in DevTools)
- [ ] Service area placeholder shows "e.g., Auckland Central, Wellington" (NOT Sydney)
- [ ] Submit attempt with `country: "Australia"` via API is rejected with HTTP 400

**Onboarding Page (`/onboarding`):**
- [ ] Country selector hidden
- [ ] Form defaults to "New Zealand"
- [ ] Service area placeholder shows NZ examples

**Profile Page (`/profile`):**
- [ ] Service area placeholder shows NZ examples

**Dashboard - Quick Access Panel:**
- [ ] Tax button shows "Tax & GST Returns" (NOT "Tax & BAS")

**Backend Enforcement:**
- [ ] POST `/api/user/onboarding` with `{ country: "Australia" }` returns:
  ```json
  { "message": "Australia is not supported yet. New Zealand only.", "field": "country" }
  ```
- [ ] Server logs show: `[ONBOARDING] Blocked country: Australia`

**Prevention Script:**
- [ ] Run `npm run lint:market` locally
- [ ] Should pass with: "✅ No market leakage detected"
- [ ] Adding "Sydney" to a component file → should fail with violation report

**Commits:** `50a65db` (comprehensive NZ lock + prevention)

---

## Fix #3B: CRITICAL Follow-up - Browser Runtime Config for Market Lock

### Symptom (After Fix #3)
- Fix #3 deployed to production with `APP_MARKET_LOCK=NZ` set in Render
- **Tested in incognito window (no cache/PWA issues)**
- `/signup` STILL shows "AU Australia" as default country
- Service area placeholder STILL shows "Sydney Metro, Melbourne CBD"
- Backend enforcement works (rejects AU submissions) ✅
- Frontend UI still defaults to AU ❌

### Root Cause
**Critical oversight:** Browser cannot read `process.env.APP_MARKET_LOCK` at runtime.

**How environment variables work:**
- **Server (Node.js):** `process.env` populated at runtime from Render env vars ✅
- **Client (Browser):** Vite replaces `process.env.*` at **BUILD time**, not runtime ❌

**What happened:**
1. We build the app once (in CI or locally)
2. At build time, `APP_MARKET_LOCK` is undefined (not set during build)
3. Vite replaces `process.env.APP_MARKET_LOCK` with `undefined` in bundled code
4. Build output is deployed to Render
5. Render sets `APP_MARKET_LOCK=NZ` but browser code already has `undefined` baked in

**Result:**
- `shared/market-config.ts` line 9: `export const MARKET_LOCK = process.env.APP_MARKET_LOCK || null;`
- On server: Works (reads from runtime env) ✅
- In browser: Always `null` (already replaced at build time) ❌
- `getAllowedCountries()` always returns `['Australia', 'New Zealand']`
- `getDefaultCountry()` always returns `'Australia'`

### How We Proved It
1. **User evidence (incognito):**
   - Eliminated cache/PWA as cause
   - Signup form still showed AU default

2. **Code inspection:**
   - `shared/market-config.ts:9` uses `process.env.APP_MARKET_LOCK`
   - This works server-side but NOT client-side

3. **Build-time vs Runtime:**
   - Environment variables in Vite are replaced at build time
   - Production env vars set in Render are NOT available to browser

### Minimal Code Changes

**Fix 1: Server-Injected Runtime Config**

**File:** `server/vite.ts`

**Added Helper Function:**
```typescript
/**
 * Inject runtime config into HTML
 * Provides browser access to server-side env vars like APP_MARKET_LOCK
 */
function injectRuntimeConfig(html: string): string {
  const marketLock = process.env.APP_MARKET_LOCK || null;
  const config = {
    marketLock,
  };

  const configScript = `<script>window.__BT_CONFIG__ = ${JSON.stringify(config)};</script>`;

  // Inject before closing </head> tag if it exists, otherwise before </body>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${configScript}</head>`);
  } else if (html.includes('</body>')) {
    return html.replace('</body>', `${configScript}</body>`);
  }

  // Fallback: prepend to HTML
  return configScript + html;
}
```

**Applied in Dev Mode (setupVite):**
```typescript
// Line 85-86: Inject runtime config before Vite transform
template = injectRuntimeConfig(template);
```

**Applied in Prod Mode (serveStatic):**
```typescript
// Lines 142-146: Protected routes
app.get(route, requireAuth, (req: any, res) => {
  const htmlPath = path.resolve(distPath, "index.html");
  let html = fs.readFileSync(htmlPath, 'utf-8');
  html = injectRuntimeConfig(html);
  res.status(200).set({ "Content-Type": "text/html" }).end(html);
});

// Lines 151-156: Fallback route
app.use("*", (_req, res) => {
  const htmlPath = path.resolve(distPath, "index.html");
  let html = fs.readFileSync(htmlPath, 'utf-8');
  html = injectRuntimeConfig(html);
  res.status(200).set({ "Content-Type": "text/html" }).end(html);
});
```

**Why this works:**
- Server reads `process.env.APP_MARKET_LOCK` at runtime (has access to Render env vars)
- Injects `<script>window.__BT_CONFIG__ = { marketLock: "NZ" };</script>` into HTML
- Browser receives this script and can access config via `window.__BT_CONFIG__`

**Fix 2: Update market-config.ts to Read from Window in Browser**

**File:** `shared/market-config.ts`

**Before:**
```typescript
export const MARKET_LOCK = process.env.APP_MARKET_LOCK || null;

export function getAllowedCountries(): readonly string[] {
  if (MARKET_LOCK === 'NZ') {
    return ['New Zealand'];
  }
  if (MARKET_LOCK === 'AU') {
    return ['Australia'];
  }
  return ALL_COUNTRIES;
}
```

**After:**
```typescript
// TypeScript declaration for injected config
declare global {
  interface Window {
    __BT_CONFIG__?: {
      marketLock: string | null;
    };
  }
}

/**
 * Get market lock value at runtime
 * Works in both browser (via injected window.__BT_CONFIG__) and server (via process.env)
 */
function getMarketLock(): string | null {
  // In browser: read from injected config
  if (typeof window !== 'undefined') {
    return window.__BT_CONFIG__?.marketLock || null;
  }

  // On server: read from environment variable
  return process.env.APP_MARKET_LOCK || null;
}

export function getAllowedCountries(): readonly string[] {
  const marketLock = getMarketLock();

  if (marketLock === 'NZ') {
    return ['New Zealand'];
  }
  if (marketLock === 'AU') {
    return ['Australia'];
  }
  return ALL_COUNTRIES;
}
```

**Why this works:**
- `typeof window !== 'undefined'` detects if running in browser or server
- Browser: reads from `window.__BT_CONFIG__?.marketLock` (injected by server)
- Server: reads from `process.env.APP_MARKET_LOCK` (runtime env var)
- All helper functions (`getAllowedCountries()`, `getDefaultCountry()`, etc.) now get correct value

**Fix 3: Add Client Verification Log**

**File:** `client/src/main.tsx`

**Added:**
```typescript
import { getAllowedCountries } from "@shared/market-config";

// Market lock diagnostic (helps verify runtime config injection)
console.log('[MARKET]', {
  lock: window.__BT_CONFIG__?.marketLock || 'none',
  allowedCountries: getAllowedCountries(),
});
```

**Why this helps:**
- Runs once at app startup
- Visible in browser console for easy debugging
- Confirms config injection worked:
  - `lock: "NZ"` (not "none")
  - `allowedCountries: ["New Zealand"]` (not both)

### Verification Checklist (Production - Incognito Window)

**With `APP_MARKET_LOCK=NZ` set in Render:**

**1. Browser Console (Open DevTools before loading):**
- [ ] Visit https://bluetradie.com/signup
- [ ] Console shows: `[MARKET] { lock: "NZ", allowedCountries: ["New Zealand"] }`
  - If shows `lock: "none"`, injection failed
  - If shows both countries, market lock not applied

**2. View Page Source (Right-click → View Page Source):**
- [ ] Search for `__BT_CONFIG__`
- [ ] Should find: `<script>window.__BT_CONFIG__ = {"marketLock":"NZ"};</script>`
- [ ] Located in `<head>` section (before other scripts)

**3. Signup Form UI:**
- [ ] Country selector is **hidden** (inspect element - should be hidden input, not dropdown)
- [ ] Service area placeholder shows "**e.g., Auckland Central, Wellington**" (NOT Sydney/Melbourne)
- [ ] Form defaults to "New Zealand" (check hidden input value in Elements tab)

**4. All Other Pages (onboarding, profile, dashboard):**
- [ ] Onboarding: Country hidden, NZ placeholders
- [ ] Profile: NZ service area placeholder
- [ ] Dashboard Quick Access: "Tax & GST Returns" (NOT "Tax & BAS")

**5. Backend Still Enforces:**
- [ ] POST to `/api/user/onboarding` with `country: "Australia"` → HTTP 400

### Deployment Gotchas

**Why this is the ONLY solution:**
- Cannot use `VITE_*` env vars (they're replaced at build time, not runtime)
- Cannot use separate builds per environment (want single build deployed everywhere)
- Cannot use API call to fetch config (race condition - components render before fetch completes)
- Server-injected HTML is the clean, reliable way to pass runtime config to browser

**Cache considerations:**
- Users visiting after deploy will get new HTML with injected config
- Service worker caches are versioned and should update automatically
- If issues persist, hard refresh (Ctrl+Shift+R) bypasses all caches

**Commits:** `eb3d638` (browser runtime config injection)

---

## Next Steps After This Playbook

When encountering new bugs:
1. Follow "Troubleshooting Order of Operations" checklist above
2. Document successful fixes in this playbook using the same structure
3. Update anti-patterns if new ones are discovered
4. Keep playbook concise - only proven solutions, not speculation
