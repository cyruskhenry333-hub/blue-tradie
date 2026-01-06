# Blue Tradie QA Bug Log
**Date**: 2026-01-05
**Session**: Rapid QA with Dev Admin Bypass

## Bugs Fixed

### BUG #1: Dev Admin Bypass User Not in Database ✅ FIXED
**Issue**: Dev bypass set userId but user didn't exist in DB, causing "User not found" errors on all API endpoints.

**Root Cause**: The bypass middleware set session userId to 'dev-admin-bypass-user-id' but never created that user in the database.

**Fix**: Made bypass middleware async and added logic to:
- Check if dev user exists in database
- Create user if missing (id: dev-admin-bypass-user, email: admin@dev.local)
- Cache creation check to avoid repeated DB lookups
- Use real user ID in session and req.user

**Files Changed**:
- `server/middleware/dev-admin-bypass.ts`

**Commit**: 1741608

**Retest Result**: ✅ Jobs API now returns [] instead of "User not found". Job creation works with proper fields.

---

### BUG #4: Missing payment_intent.succeeded Webhook Handler ✅ FIXED
**Issue**: Stripe webhook missing handler for `payment_intent.succeeded` events.

**Root Cause**: Webhook handler at `server/routes/stripe-webhook.ts` only had handlers for payment_failed but not succeeded.

**Fix**: Added `handlePaymentIntentSucceeded()` function to:
- Log payment intent success with full details
- Mark invoice as paid if invoiceId present in metadata
- Update payment status in database

**Files Changed**:
- `server/routes/stripe-webhook.ts`

**Commit**: 4179431

**Impact**: Payment success events now properly update invoice status to 'paid'.

---

### BUG #5: Login Button Routes to Client-Side NotFound ✅ FIXED
**Issue**: Clicking "Login" button from marketing homepage lands on client-side NotFound page instead of server-rendered login page.

**Root Cause**: Login button in `landing.tsx` used `setLocation('/login')` which attempted client-side SPA navigation, but `/login` is a server-rendered page (not in React router). This caused the SPA router to show NotFound.

**Fix**: Changed Login button to use hard navigation:
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

**Files Changed**:
- `client/src/pages/landing.tsx`

**Commit**: dbdf792

**Impact**: Login button now correctly loads the server-rendered login page instead of hitting client-side 404.

---

### BUG #6: Password Gate Blocks Magic Link Authenticated Users ✅ FIXED
**Issue**: Dashboard shows blank screen after successful magic link login. Network shows HTML "password-gate" response instead of JSON, causing SPA parsing failure.

**Root Cause**: Password gate middleware only checked `session.passwordAuthenticated` flag (preview password), not `session.userId` flag (magic link auth). Authenticated users were redirected to gate page, breaking dashboard rendering.

**Fix**: Updated gate middleware to check BOTH authentication methods:
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

**Files Changed**:
- `server/middleware/password-gate.ts`

**Commit**: f5ef52b

**Impact**: Magic link authenticated users can now access `/dashboard` and all app routes without hitting password gate redirect.

---

### BUG #7: Magic Link Redirects to Non-Existent Route ✅ FIXED
**Issue**: After successful magic link login, dashboard shows blank screen. React app shell renders (quick actions, AI assistant, footer) but main content area (Child 0) is empty.

**Root Cause**: Route mismatch between server redirect and client router:
- Server: `auth-verify.ts` redirects to `/dashboard?fresh=1`
- Client: `App.tsx:142` has Dashboard at `/` (root), NOT `/dashboard`
- Wouter router returns null for unmatched routes → empty DIV

**Fix**: Updated auth verify redirect to match actual route:
```typescript
// Before:
const DEFAULT_REDIRECT = "/dashboard?fresh=1";
const redirect = ... "/dashboard?fresh=1" ...

// After:
const DEFAULT_REDIRECT = "/?fresh=1";
const redirect = ... "/?fresh=1" ...
```

**Files Changed**:
- `server/routes/auth-verify.ts`

**Commit**: 624c1d5, a3e6fce (comprehensive fix)

**Follow-up Fix**: Initial fix only updated `auth-verify.ts` defaults, but `routes.ts:202` was embedding `/dashboard` in JWT token payload, bypassing the fix. Comprehensive fix updated ALL 4 locations:
1. `server/routes.ts:202` - magic link token creation
2. `server/index.ts:149` - /login redirect for authenticated users
3. `server/services/auth-service.ts:73` - default redirect parameter
4. `client/App.tsx:143` - added `/dashboard` route alias as safeguard

**Impact**: Magic link login now redirects to correct route everywhere, dashboard content renders properly. Client-side alias prevents future blank screens from legacy links.

---

## Bugs Found (Not Yet Fixed)

### BUG #2: Quote API Returns Generic Error Messages
**Issue**: POST /api/quotes returns generic "Failed to create quote" instead of Zod validation errors.

**Impact**: Makes debugging quote creation impossible without checking server logs.

**Root Cause**: Error handler in `server/routes/quotes-api.ts` line 39 catches all errors and returns generic message.

**Recommendation**: Return Zod validation errors in development mode:
```typescript
catch (error) {
  console.error("[QUOTES API] Error creating quote:", error);
  const errorMessage = process.env.NODE_ENV === 'development' && error instanceof ZodError
    ? { message: "Validation failed", errors: error.errors }
    : { message: "Failed to create quote" };
  res.status(500).json(errorMessage);
}
```

**Files to Change**:
- `server/routes/quotes-api.ts` (and all similar API routes)

---

### BUG #3: Analytics Events Table Missing session_id Column
**Issue**: Column "session_id" of relation "analytics_events" does not exist

**Error Log**:
```
[ANALYTICS] Error tracking event: error: column "session_id" of relation "analytics_events" does not exist
```

**Impact**: All analytics event tracking fails silently.

**Root Cause**: Database schema mismatch - code expects `session_id` column but table doesn't have it.

**Recommendation**: Schema already HAS the column in `shared/schema.ts` line 1055, but database migration hasn't been applied. Run `npm run db:push` and select "No, add the constraint without truncating" when prompted.

**Files to Change**:
- None - just need to run migration command

**Note**: This affects both local dev and production databases. Production likely already has the column (based on Render logs showing db:push runs on deploy).

---

## QA Status

### ✅ Tested & Working
- Dashboard analytics insights endpoint
- Jobs: List (GET /api/jobs)
- Jobs: Create (POST /api/jobs) - requires customerName + description

### ⚠️ Tested with Issues
- Quotes: Create (POST /api/quotes) - validation errors not user-friendly
- Analytics: Event tracking (fails due to missing column)

### ⏳ Not Yet Tested
- Quotes: List, Update, Delete
- Quotes → Invoice conversion
- Invoices: Full CRUD
- Documents: Upload/Download
- Directory: Listings/Search/Filter
- Calendar: Event CRUD
- Automations: Rule creation
- Payments UI
- Notifications/Toasts
- Settings: Save functionality

---

## Next Steps
1. Fix BUG #3 (analytics session_id) - quick win
2. Improve error messages across all API routes (BUG #2)
3. Continue QA on remaining features
4. Test invoices creation and payment flows
5. Test automation workflows (no external sends in dev)

