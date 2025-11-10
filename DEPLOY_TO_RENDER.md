# 🚀 Deploy Blue Tradie to Render - Quick Start Guide

This guide gets Blue Tradie running on Render with production-grade hardening.

## ✅ What's Been Prepared

All hardening and configuration is complete:

- ✅ Database schema hardened (unique constraints, indexes, idempotency)
- ✅ Stripe webhooks with database-backed event tracking
- ✅ Render configuration (web + worker services)
- ✅ Environment variables documented
- ✅ Production build verified
- ✅ Smoke tests ready

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Render Account**: https://render.com (free to start)
2. **AWS S3 Bucket**: For file uploads
3. **SendGrid API Key**: For emails
4. **Stripe Account**: For payments (test or live keys)
5. **OpenAI API Key**: For chat features
6. **Anthropic API Key**: For automation
7. **GitHub Repo**: Your Blue Tradie code (this repo)

## 🎯 Deployment Steps

### Step 1: Push Code to GitHub

```bash
# You have local commits on feature/full-stack-all-tracks
# Push to GitHub
git push origin feature/full-stack-all-tracks

# Create a pull request or push directly to main:
git checkout main
git merge feature/full-stack-all-tracks
git push origin main
```

### Step 2: Create Render Services

**Option A: Automated Blueprint Deployment (Recommended)**

1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint Instance"
3. Connect your GitHub repository
4. Select branch: `main` (or production branch)
5. Render detects `render.yaml` and creates:
   - `blue-tradie-web` (web service)
   - `blue-tradie-worker` (background worker)
   - `blue-tradie-db` (PostgreSQL database)
6. **Important**: Create Redis manually (Step 3)

**Option B: Manual Service Creation**

1. **PostgreSQL Database**
   - Dashboard → New → PostgreSQL
   - Name: `blue-tradie-db`
   - Plan: Starter ($7/mo)
   - Create Database

2. **Redis Instance**
   - Dashboard → New → Redis
   - Name: `blue-tradie-redis`
   - Plan: Starter ($7/mo)
   - Create Redis

3. **Web Service**
   - Dashboard → New → Web Service
   - Connect repository: `main` branch
   - Name: `blue-tradie-web`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
   - Plan: Starter ($7/mo)
   - **Advanced → Health Check Path**: `/healthz`

4. **Worker Service**
   - Dashboard → New → Background Worker
   - Connect repository: `main` branch
   - Name: `blue-tradie-worker`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start:worker`
   - Plan: Starter ($7/mo)

### Step 3: Configure Environment Variables

**For WEB Service** (set in Render dashboard):

```bash
# Core
NODE_ENV=production
APP_URL=https://blue-tradie-web.onrender.com  # Your actual Render URL
APP_DOMAIN=blue-tradie-web.onrender.com

# Database (auto-populated if using Render PostgreSQL)
DATABASE_URL=<from Render database connection string>

# Redis (auto-populated if using Render Redis)
REDIS_URL=<from Render Redis connection string>

# Email
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Blue Tradie

# AI Services
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx  # or sk_test_ for testing
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=<configure in Step 4>

# AWS S3
STORAGE_PROVIDER=s3
S3_BUCKET=your-bucket-name
S3_REGION=ap-southeast-2
S3_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxx

# Worker Control
ENABLE_INLINE_WORKER=false  # Important!

# Optional
SENTRY_DSN=https://xxxxxx@sentry.io/xxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxx
BUSINESS_ABN=12345678901
```

**For WORKER Service** (set in Render dashboard):

```bash
# Core
NODE_ENV=production

# Database (same as web)
DATABASE_URL=<from Render database connection string>

# Redis (same as web) - REQUIRED!
REDIS_URL=<from Render Redis connection string>

# Email (for automation emails)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Blue Tradie

# AI Services (for automation)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Optional
SENTRY_DSN=https://xxxxxx@sentry.io/xxxxxx
```

**Tip**: Use Render's environment groups to share variables between services.

### Step 4: Initialize Database

After first deployment:

1. Go to Render Dashboard → `blue-tradie-web` → Shell
2. Run migrations:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### Step 5: Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint URL: `https://blue-tradie-web.onrender.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy **Signing Secret** (starts with `whsec_`)
5. Add to Render:
   - Dashboard → `blue-tradie-web` → Environment
   - Add: `STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx`
   - Save Changes (triggers redeploy)

### Step 6: Verify Deployment

**Automated Health Checks:**

```bash
# Check health endpoint
curl https://blue-tradie-web.onrender.com/healthz
# Expected: {"status":"ok"}

# Check API health
curl https://blue-tradie-web.onrender.com/api/system/health
# Expected: {"status":"healthy","database":"connected"}

# Check Stripe webhook ping
curl https://blue-tradie-web.onrender.com/api/stripe/webhook/ping
# Expected: {"ok":true,"hasWebhookSecret":true}
```

**Run Smoke Tests:**

```bash
# From your local machine
APP_URL=https://blue-tradie-web.onrender.com npm run test:smoke
```

**Manual Verification:**

See `tests/smoke-tests.ts` for full checklist. Key flows:

1. **Quote → Invoice → Payment**
   - Create quote
   - Send to customer
   - Customer accepts
   - Payment processes
   - Invoice marked paid

2. **AI Chat**
   - Ask AI a question
   - Verify response

3. **Customer Portal**
   - Share invoice link
   - Customer views without login
   - Customer pays invoice

### Step 7: Monitor Logs

**Web Service Logs:**
```bash
# Render Dashboard → blue-tradie-web → Logs
# Should see:
#   [Server] Skipping inline worker (use separate worker service)
#   Server running on port 10000
```

**Worker Service Logs:**
```bash
# Render Dashboard → blue-tradie-worker → Logs
# Should see:
#   [Worker] Starting Bull queue workers...
#   [AutomationWorker] Started and listening for jobs
```

## 🔧 Troubleshooting

### Build Fails

**Issue**: `npm install` fails or build errors

**Solution**:
- Check Node.js version is 20.x (set in `package.json` engines)
- Ensure all dependencies in `package.json`
- Check Render build logs for specific error

### Database Connection Fails

**Issue**: `DATABASE_URL` not connecting

**Solution**:
- Verify `DATABASE_URL` includes `?sslmode=require`
- Check database is in same region as web service
- Test connection in Render Shell: `psql $DATABASE_URL`

### Worker Not Processing Jobs

**Issue**: Automation jobs not running

**Solution**:
- Verify `REDIS_URL` is identical in web and worker
- Check worker logs for connection errors
- Test Redis: `redis-cli -u $REDIS_URL ping`

### Stripe Webhooks Failing

**Issue**: Payments not updating invoice status

**Solution**:
- Verify webhook endpoint URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Review webhook logs in Stripe Dashboard → Developers → Webhooks
- Check `webhook_events` table in database

### Worker Costs Too High

**Issue**: Render billing concerns

**Solution**:
- Start with Starter plan ($7/mo per service)
- Monitor resource usage in Render dashboard
- Scale down worker instance size if not processing many jobs
- Combine web + worker in single instance: Set `ENABLE_INLINE_WORKER=true` (not recommended for production)

## 💰 Expected Costs (Monthly)

- Web Service (Starter): $7
- Worker Service (Starter): $7
- PostgreSQL (Starter): $7
- Redis (Starter): $7
- **Total: $28/mo**

First 90 days free with Render credits!

## 📚 Additional Resources

- **Environment Variables**: See `ENV_VARS_CHECKLIST.md`
- **Full Deployment Guide**: See `DEPLOYMENT.md`
- **Smoke Tests**: See `tests/smoke-tests.ts`
- **Database Schema**: See `shared/schema.ts`
- **Render Blueprint**: See `render.yaml`

## 🎉 Success!

Once all checks pass, Blue Tradie is live in production!

**Next Steps:**
1. Test all critical user flows
2. Set up monitoring (Sentry for errors)
3. Configure custom domain (optional)
4. Set up automated backups
5. Plan for scaling as usage grows

**Support:**
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: [Your repo issues page]

---

**Generated as part of production hardening sprint**
**Last Updated**: January 2025
