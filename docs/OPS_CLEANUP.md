# Operations Cleanup Guide

## Overview

Blue Tradie provides safe, reversible tooling for cleaning up both database signups and Stripe subscriptions/payments. This guide covers manual Stripe Dashboard steps and automated CLI scripts.

## Manual Stripe Dashboard Steps

For quick one-off operations, use the Stripe Dashboard:

### 1. Webhook Verification
- **Developers** → **Webhooks**
- Verify endpoint URL: `https://bluetradie.com/api/stripe/webhook`
- Check webhook secret matches your `STRIPE_WEBHOOK_SECRET` env var

### 2. Cancel Subscriptions
- **Customers** → Search email
- Click customer → **Subscriptions** tab
- **Cancel subscription**:
  - **Immediate**: Cancels now, may trigger prorated refund
  - **At period end**: Cancels when current billing period expires

### 3. Process Refunds
- **Payments** → Find payment
- Click **Refund** button
- Select full or partial refund amount
- Add reason (optional but recommended)

## CLI Scripts

### Prerequisites

```bash
# Required environment variables
export STRIPE_SECRET_KEY=sk_test_... # or sk_live_...
export DATABASE_URL=your_database_url
export SESSION_SECRET=your_session_secret

# Install dependencies if needed
npm install commander stripe
```

### Database User Cleanup

#### Single User Cleanup
```bash
# DRY RUN - see what would happen
npx tsx scripts/admin/cleanup-users.ts --email cyruskhenry333@gmail.com --dry-run

# Execute cleanup
npx tsx scripts/admin/cleanup-users.ts --email cyruskhenry333@gmail.com
```

#### Bulk Cleanup (Disabled for Safety)
```bash
# Bulk operations require explicit confirmation
npx tsx scripts/admin/cleanup-users.ts --all --confirm "I understand" --dry-run
```

**What it does:**
- Soft-deletes user (sets `deletedAt` timestamp)
- Removes related sessions and temporary data
- Preserves audit trail and billing records
- Logs summary of affected database rows

### Stripe Subscription Cancellation

#### Single Customer
```bash
# DRY RUN - see what would be cancelled
npx tsx scripts/admin/stripe-cancel.ts --email someone@example.com --mode period_end --dry-run

# Cancel at period end (recommended)
npx tsx scripts/admin/stripe-cancel.ts --email someone@example.com --mode period_end

# Immediate cancellation
npx tsx scripts/admin/stripe-cancel.ts --email someone@example.com --mode immediate

# Immediate cancel + refund all charges
npx tsx scripts/admin/stripe-cancel.ts --email someone@example.com --mode immediate --refund all
```

#### Bulk Operations (Test Mode Only)
```bash
# DRY RUN bulk cancellation (test environment)
npx tsx scripts/admin/stripe-cancel.ts --all-test --mode period_end --confirm "CANCEL ALL" --dry-run

# Execute bulk cancellation (requires test keys)
npx tsx scripts/admin/stripe-cancel.ts --all-test --mode period_end --confirm "CANCEL ALL"
```

**Safety Notes:**
- Live key bulk operations are disabled for safety
- Always test with `--dry-run` first
- Bulk operations require explicit `--confirm "CANCEL ALL"`
- Script detects live vs test keys automatically

## Command Options

### cleanup-users.ts
- `--email <email>`: Target specific user email
- `--all`: Cleanup all users (requires confirmation)
- `--dry-run`: Show actions without executing
- `--confirm "I understand"`: Required for bulk operations

### stripe-cancel.ts
- `--email <email>`: Target customer by email
- `--all-live`: All customers in live mode (disabled)
- `--all-test`: All customers in test mode
- `--mode <immediate|period_end>`: Cancellation timing
- `--refund <all|pi_id>`: Refund recent charges
- `--dry-run`: Preview actions only
- `--confirm "CANCEL ALL"`: Required for bulk operations

## Environment Detection

The scripts automatically detect your Stripe mode:

### Test Mode (`sk_test_...`)
- Safe for experimentation
- No real money involved
- Bulk operations allowed with confirmation

### Live Mode (`sk_live_...`)
- Real customer data and payments
- Extra safety warnings displayed
- Bulk operations disabled
- Individual operations require caution

## Safety Features

### Multiple Confirmation Layers
1. **Dry run required**: Always test with `--dry-run` first
2. **Explicit confirmations**: Dangerous operations need confirmation strings
3. **Mode detection**: Script warns when using live keys
4. **Operation limits**: Bulk operations have extra restrictions

### Audit Trail
- All operations logged with timestamps
- Database soft-deletes preserve records
- Stripe operations create refund records
- Failed operations logged with error details

### Reversibility
- **Database**: Soft deletes can be reversed by clearing `deletedAt`
- **Stripe subscriptions**: Can be reactivated within grace period
- **Refunds**: Cannot be reversed, but new charges can be created

## Common Usage Patterns

### Test Cleanup After Development
```bash
# Clean test Stripe data
npx tsx scripts/admin/stripe-cancel.ts --all-test --mode immediate --confirm "CANCEL ALL" --dry-run
npx tsx scripts/admin/stripe-cancel.ts --all-test --mode immediate --confirm "CANCEL ALL"

# Clean test database users
npx tsx scripts/admin/cleanup-users.ts --all --confirm "I understand" --dry-run
# Note: Bulk DB cleanup disabled for safety - use individual emails
```

### Customer Request Cleanup
```bash
# Customer wants full account deletion
npx tsx scripts/admin/cleanup-users.ts --email customer@example.com --dry-run
npx tsx scripts/admin/stripe-cancel.ts --email customer@example.com --mode immediate --refund all --dry-run

# Execute if dry run looks correct
npx tsx scripts/admin/cleanup-users.ts --email customer@example.com
npx tsx scripts/admin/stripe-cancel.ts --email customer@example.com --mode immediate --refund all
```

### Subscription Cancellation Only
```bash
# Cancel subscription but keep user account
npx tsx scripts/admin/stripe-cancel.ts --email customer@example.com --mode period_end
```

## Error Handling

### Common Errors
- **Missing env vars**: Ensure `STRIPE_SECRET_KEY` and `DATABASE_URL` are set
- **Invalid confirmations**: Check spelling of confirmation strings
- **Network errors**: Retry after checking internet connection
- **Permission errors**: Ensure Stripe keys have required permissions

### Recovery
- **Failed transactions**: Operations are atomic where possible
- **Partial failures**: Scripts continue processing and report errors
- **Data corruption**: Database operations use transactions when possible

## Admin API (Optional)

For programmatic access, guarded admin endpoints are available:

```bash
# User cleanup API
curl -X POST https://bluetradie.com/api/admin/users/cleanup \
  -H "X-Admin-Key: your_admin_key" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "dryRun": true}'

# Stripe cancellation API  
curl -X POST https://bluetradie.com/api/admin/stripe/cancel \
  -H "X-Admin-Key: your_admin_key" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "mode": "period_end", "dryRun": true}'
```

**Security**: Admin API requires `ADMIN_KEY` environment variable and is rate-limited.

## Monitoring & Alerts

### Log Monitoring
- Scripts output structured logs for monitoring systems
- Failed operations trigger error logs with context
- Success operations log summary statistics

### Recommended Alerts
- Multiple failed cleanup attempts (potential abuse)
- Large refund volumes (potential fraud)
- Bulk operation executions (operational awareness)

## Legal & Compliance

### Data Protection
- Soft deletes comply with "right to be forgotten"
- Audit trails maintained for financial compliance
- Personal data anonymized rather than deleted where legally required

### Financial Records
- Stripe transaction records preserved for tax compliance
- Refund records maintained per financial regulations
- Customer billing history preserved for disputes

---

**⚠️ Always use `--dry-run` first and verify the output before executing any cleanup operations.**