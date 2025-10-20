# Stripe Webhook Runbook

## Overview

Blue Tradie uses Stripe webhooks to handle post-payment user creation and magic-link email delivery. This runbook covers webhook configuration, troubleshooting, and maintenance.

## Webhook Configuration

### Production Endpoint
```
https://bluetradie.com/api/stripe/webhook
```

### Environment Variables
```
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard)
STRIPE_VERIFY_DISABLED=false (set to true only for debugging)
```

## Setup Instructions

### 1. Configure Webhook in Stripe Dashboard

1. Go to Stripe Dashboard → Webhooks
2. Click "Add endpoint"
3. URL: `https://bluetradie.com/api/stripe/webhook`
4. Events to send:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 2. Set Environment Variables

Copy the webhook signing secret from Stripe:

```bash
# In Render Dashboard → Environment
STRIPE_WEBHOOK_SECRET=whsec_1234abcd... (from Stripe webhook settings)
```

### 3. Restart Service

After updating environment variables, restart the service in Render.

## Verification

### Check Startup Logs

Look for these log lines after restart:

```
[ROUTES] ["POST /api/stripe/webhook", "GET /api/stripe/webhook/ping"]
[STRIPE CONFIG] { verifyDisabled: false, whsecPrefix: "whsec_12..." }
```

### Test Webhook Health

```bash
curl -i https://bluetradie.com/api/stripe/webhook/ping
```

Expected response:
```json
{"ok": true, "verifyDisabled": false, "hasWebhookSecret": true}
```

### Test Webhook Signature Validation

```bash
curl -i https://bluetradie.com/api/stripe/webhook \
  -X POST \
  -H "Content-Type: application/json" \
  --data "{}"
```

Expected response:
```
HTTP/1.1 400 Bad Request
Missing Stripe signature or webhook secret
```

## Testing with Stripe CLI

### Install Stripe CLI
```bash
npm install -g @stripe/stripe-cli
stripe login
```

### Forward Webhooks to Local Development
```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

### Trigger Test Events
```bash
stripe trigger checkout.session.completed
stripe trigger invoice.paid
```

## Troubleshooting

### Webhook Returns 400 "Body parsing error"

**Cause:** JSON middleware parsing body before webhook handler

**Solution:** Ensure webhook is mounted before any `express.json()` middleware in `server/index.ts`

### Webhook Returns 401 "Unauthorized"

**Cause:** Authentication middleware blocking webhook

**Solution:** Webhook should be mounted before authentication middleware

### Webhook Returns 400 "Invalid signature"

**Cause:** Incorrect webhook secret or body modification

**Solutions:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Check webhook is receiving raw Buffer body
3. Temporarily set `STRIPE_VERIFY_DISABLED=true` to isolate issue

### User Creation Fails

**Cause:** Database connection or user creation logic error

**Solutions:**
1. Check database connection in logs
2. Verify user metadata in webhook payload
3. Check `storage.upsertUser()` implementation

### Email Not Sent

**Cause:** SendGrid configuration or email service error

**Solutions:**
1. Check SendGrid API key configuration
2. Verify email service logs
3. Check magic-link token generation

## Rotating Webhook Secret

1. **Generate new secret in Stripe:**
   - Dashboard → Webhooks → Select endpoint → Signing secret → Reveal → Generate new

2. **Update environment variable:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_new_secret_here
   ```

3. **Restart service**

4. **Test with resend:**
   - In Stripe Dashboard, resend a recent event
   - Check logs for `[STRIPE OK]`

## Monitoring

### Success Indicators
- `[STRIPE OK] { type: 'checkout.session.completed', id: 'evt_...' }`
- `✅ User created: user@example.com`
- `📧 Welcome email sent to: user@example.com`

### Error Indicators
- `❌ Stripe verification failed`
- `❌ Error processing checkout`
- `❌ Failed to send welcome email`

### Performance
- Webhook should complete in < 5 seconds
- Email delivery should complete in < 10 seconds
- Failed webhooks will be retried by Stripe automatically

## Common Pitfalls

1. **Middleware Order:** Webhook must be first, before JSON parsers
2. **Raw Body:** Webhook requires `bodyParser.raw()`, not `express.json()`
3. **Signature Verification:** Must use exact webhook secret from Stripe
4. **Idempotency:** Events may be sent multiple times, handle duplicates
5. **Environment Sync:** Webhook secret must match between Stripe and app

## Emergency Procedures

### Disable Webhook Processing
```
STRIPE_VERIFY_DISABLED=true
```
This will accept all webhooks without processing (returns 200 OK).

### Quick Health Check
```bash
curl https://bluetradie.com/api/stripe/webhook/ping
```

### View Recent Webhook Events
Check Stripe Dashboard → Webhooks → Select endpoint → Events tab

## Support

For webhook issues:
1. Check startup logs for `[ROUTES]` and `[STRIPE CONFIG]`
2. Test ping endpoint health
3. Verify webhook secret in environment
4. Check Stripe Dashboard event delivery status