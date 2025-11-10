# Environment Variables Checklist

Complete list of environment variables required for production deployment, grouped by area.

## 🔴 Critical - Required for Basic Operation

### App/Auth
```bash
NODE_ENV=production                    # Production mode
APP_URL=https://yourdomain.com         # Full URL with protocol
APP_DOMAIN=yourdomain.com              # Domain only (no protocol)
SESSION_COOKIE_NAME=bt_sess            # Session cookie name
SESSION_TTL_DAYS=30                    # Session expiry (days)
MAGIC_LINK_TTL_MINUTES=15              # Magic link expiry (minutes)
WEBHOOK_SECRET_RANDOM=<32-char-random> # Webhook verification secret
```

### Database
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
# Example (Neon):
# postgresql://user:pass@ep-xxx.region.aws.neon.tech/bluetradie?sslmode=require
# Example (Render):
# postgresql://user:pass@hostname.region.render.com/db_name
```

### Redis (Required for Sessions & Bull Queues)
```bash
REDIS_URL=redis://default:password@host:6379
# OR separate components:
REDIS_HOST=hostname.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

### Email (SendGrid)
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_NAME=Blue Tradie
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

### AI Services
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxx     # Required for chat
OPENAI_MODEL=gpt-4o-mini                           # Model to use
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxx   # Required for automation
```

### File Storage (AWS S3 or compatible)
```bash
STORAGE_PROVIDER=s3
S3_BUCKET=your-bucket-name
S3_REGION=ap-southeast-2                # AWS region
S3_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxx

# For Cloudflare R2 or other S3-compatible:
# S3_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
```

---

## 🟡 Important - Required for Payments

### Stripe (Required if using payment features)
```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Use test keys for staging:
# STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
# STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
# STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Important:** Set up webhook endpoint in Stripe Dashboard:
- URL: `https://yourdomain.com/api/stripe/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

---

## 🟢 Optional - Enhanced Features

### SMS Notifications (Twilio)
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxx

# If not set, SMS features will be disabled
```

### Error Tracking (Sentry)
```bash
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567
LOG_LEVEL=info  # debug, info, warn, error
```

### PWA Push Notifications
```bash
VAPID_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxx

# Generate with: npx web-push generate-vapid-keys
```

### Business Information (AU/NZ Compliance)
```bash
BUSINESS_ABN=12345678901
BUSINESS_ADDRESS=123 Main St, Sydney NSW 2000
```

---

## ⚙️ Platform-Specific Variables

### Render-Specific
```bash
# Web service should NOT run inline worker
ENABLE_INLINE_WORKER=false

# Worker service can leave this unset (defaults to false)
```

### Single-Server Deployments (Heroku, Railway, etc.)
```bash
# If running web + worker in same process:
ENABLE_INLINE_WORKER=true

# Port (usually auto-set by platform)
PORT=5000
```

---

## 📋 Quick Validation Checklist

Before deploying, ensure you have:

### Minimum Required (App won't start without these):
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (valid PostgreSQL connection string)
- [ ] `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`
- [ ] `APP_URL` and `APP_DOMAIN` (matching your deployment URL)
- [ ] `SENDGRID_API_KEY` and `EMAIL_FROM_ADDRESS`
- [ ] `OPENAI_API_KEY` and `ANTHROPIC_API_KEY`
- [ ] `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

### Required for Payments:
- [ ] `STRIPE_SECRET_KEY` (use `sk_live_` for production)
- [ ] `STRIPE_PUBLISHABLE_KEY` (use `pk_live_` for production)
- [ ] `STRIPE_WEBHOOK_SECRET` (get from Stripe webhook settings)
- [ ] Webhook endpoint configured in Stripe Dashboard

### Recommended for Production:
- [ ] `SENTRY_DSN` (error tracking)
- [ ] `TWILIO_ACCOUNT_SID` (SMS notifications)
- [ ] `BUSINESS_ABN` (AU/NZ tax compliance)

### Security Checks:
- [ ] All secrets are production keys (not test/dev)
- [ ] `WEBHOOK_SECRET_RANDOM` is cryptographically random (32+ chars)
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] Redis has authentication enabled (password set)
- [ ] No secrets committed to git (.env in .gitignore)

---

## 🔒 Security Best Practices

1. **Never commit secrets to git**
   - Always use `.env` file (gitignored)
   - Use platform secret management (Render, Heroku config vars)

2. **Use different keys for staging/production**
   - Stripe: `sk_test_` vs `sk_live_`
   - Separate databases for staging/prod
   - Different S3 buckets

3. **Rotate secrets regularly**
   - Database passwords: every 90 days
   - API keys: when team members leave
   - Webhook secrets: if leaked

4. **Use environment-specific values**
   ```bash
   # Staging
   APP_URL=https://staging.yourdomain.com
   STRIPE_SECRET_KEY=sk_test_xxxxx

   # Production
   APP_URL=https://yourdomain.com
   STRIPE_SECRET_KEY=sk_live_xxxxx
   ```

---

## 📝 Setting Variables by Platform

### Render
```bash
# Dashboard → Service → Environment
# Add variables via UI or render.yaml
```

### Heroku
```bash
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL="postgresql://..."
# Or via dashboard: Settings → Config Vars
```

### Railway
```bash
# Dashboard → Project → Variables
# Or via railway.json
```

### Docker/Docker Compose
```bash
# Use .env file or docker-compose.yml env_file:
docker run --env-file .env blue-tradie
```

### AWS Elastic Beanstalk
```bash
eb setenv NODE_ENV=production DATABASE_URL="postgresql://..."
# Or via .ebextensions/env.config
```

---

## 🧪 Testing Environment Variables

```bash
# Check all required vars are set
node -e "
const required = ['DATABASE_URL', 'REDIS_URL', 'OPENAI_API_KEY', 'SENDGRID_API_KEY', 'S3_BUCKET'];
const missing = required.filter(v => !process.env[v]);
if (missing.length) {
  console.error('Missing required env vars:', missing);
  process.exit(1);
} else {
  console.log('✓ All required env vars are set');
}
"

# Test database connection
npm run db:push

# Test Redis connection
node -e "
import('ioredis').then(({default: Redis}) => {
  const redis = new Redis(process.env.REDIS_URL);
  redis.ping().then(() => {
    console.log('✓ Redis connection successful');
    redis.disconnect();
  });
});
"
```

---

## 📚 Additional Resources

- `.env.example` - Template with all variables
- `DEPLOYMENT.md` - Full deployment guide
- `render.yaml` - Render blueprint with env var definitions
