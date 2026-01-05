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

