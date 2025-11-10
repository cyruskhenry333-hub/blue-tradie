# Blue Tradie - Production Deployment Guide

Complete guide for deploying Blue Tradie to production.

---

## 🚀 Quick Start: Render Deployment (Recommended)

The fastest way to deploy Blue Tradie to production with separate web and worker services.

### Architecture

- **Web Service**: Express server serving React SPA + REST API
- **Worker Service**: Bull queue processor for background jobs (automation, emails)
- **PostgreSQL Database**: Render managed PostgreSQL
- **Redis**: Render managed Redis (for sessions & Bull queues)

### Deployment Steps

#### 1. Prerequisites

- GitHub repository with your Blue Tradie code
- Render account (free tier available): https://render.com
- AWS S3 bucket for file storage (or compatible alternative)
- SendGrid API key for emails
- Stripe account (if using payments)
- OpenAI + Anthropic API keys

#### 2. Create Render Blueprint

Blue Tradie includes a `render.yaml` blueprint for automatic service creation.

**Option A: Blueprint Auto-Deploy (Recommended)**

1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint Instance"
3. Connect your GitHub repository
4. Select branch: `main` (or your production branch)
5. Render will automatically detect `render.yaml` and create:
   - Web service: `blue-tradie-web`
   - Worker service: `blue-tradie-worker`
   - PostgreSQL database: `blue-tradie-db`
6. You'll need to create Redis manually (see step 3)

**Option B: Manual Service Creation**

If auto-deploy doesn't work, create services manually:

1. **Database**: New PostgreSQL → Name: `blue-tradie-db` → Plan: Starter
2. **Redis**: New Redis → Name: `blue-tradie-redis` → Plan: Starter ($7/mo)
3. **Web Service**:
   - Type: Web Service
   - Build: `npm ci && npm run build`
   - Start: `npm start`
   - Health Check: `/healthz`
4. **Worker Service**:
   - Type: Background Worker
   - Build: `npm ci && npm run build`
   - Start: `npm run start:worker`

#### 3. Configure Environment Variables

In Render dashboard, set these environment variables for **both web and worker** services:

**Required - Web & Worker:**
```bash
NODE_ENV=production
DATABASE_URL=<from Render PostgreSQL>
REDIS_URL=<from Render Redis>
SENDGRID_API_KEY=<your-key>
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
OPENAI_API_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
```

**Required - Web Only:**
```bash
APP_URL=https://blue-tradie-web.onrender.com  # Your actual URL
APP_DOMAIN=blue-tradie-web.onrender.com
STRIPE_SECRET_KEY=<your-key>
STRIPE_PUBLISHABLE_KEY=<your-key>
STRIPE_WEBHOOK_SECRET=<from Stripe dashboard>
S3_BUCKET=<your-bucket>
S3_REGION=ap-southeast-2
S3_ACCESS_KEY_ID=<your-key>
S3_SECRET_ACCESS_KEY=<your-key>
ENABLE_INLINE_WORKER=false  # Important: Don't run worker in web process
```

**Optional:**
```bash
SENTRY_DSN=<your-sentry-dsn>
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>
BUSINESS_ABN=<your-abn>
```

#### 4. Initialize Database

After first deploy, run database migrations:

```bash
# In Render web service shell (Dashboard → Shell tab)
npm run db:push
npm run db:seed
```

#### 5. Configure Stripe Webhooks

1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-render-url.onrender.com/api/stripe/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret → Set as `STRIPE_WEBHOOK_SECRET` in Render

#### 6. Verify Deployment

Test these endpoints:

```bash
# Health check
curl https://your-render-url.onrender.com/healthz
# Expected: {"status":"ok"}

# API health
curl https://your-render-url.onrender.com/api/system/health
# Expected: {"status":"healthy","database":"connected",...}
```

### Service Roles

**Web Service** (`blue-tradie-web`):
- Serves React SPA from `/dist/client`
- Handles all HTTP/API requests
- WebSocket connections for real-time updates
- Health check endpoint: `/healthz`
- Does NOT process background jobs (worker handles those)

**Worker Service** (`blue-tradie-worker`):
- Processes Bull queue jobs from Redis
- Runs automation rules (delayed actions)
- Sends scheduled emails
- No HTTP server (no port binding)
- Shares database and Redis with web service

### Scaling

- **Web**: Increase instance count for more concurrent users
- **Worker**: Increase instance count for faster job processing
- **Database**: Upgrade plan for more storage/connections
- **Redis**: Upgrade plan for more memory (if queue grows large)

### Costs (Render Pricing)

- Web Service (Starter): $7/mo
- Worker Service (Starter): $7/mo
- PostgreSQL (Starter): $7/mo
- Redis (Starter): $7/mo
- **Total: ~$28/mo** (first month free with Render credits)

### Troubleshooting

**Build fails:**
- Check `package.json` has `"engines": {"node": "20.x"}`
- Ensure all dependencies are in `package.json` (not just `devDependencies`)

**Database connection errors:**
- Verify `DATABASE_URL` is set correctly
- Check database firewall rules (Render services auto-whitelisted)

**Worker not processing jobs:**
- Check `REDIS_URL` is identical in web and worker services
- View worker logs in Render dashboard → Worker service → Logs
- Verify automation rules are created and active

**Stripe webhooks failing:**
- Ensure `/api/stripe/webhook` is accessible (no auth required)
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Review webhook logs in Stripe dashboard

---

## Prerequisites

- Node.js 20.x
- PostgreSQL 14+ database
- Redis 6+ instance
- Domain name with SSL certificate
- SMTP server (SendGrid recommended)
- Cloud storage (AWS S3 or compatible)

## Infrastructure Requirements

### Required Services

1. **Application Server**
   - Node.js runtime environment
   - Minimum 2GB RAM, 2 CPU cores
   - Recommended: 4GB RAM, 4 cores for production load

2. **Database (PostgreSQL)**
   - Managed service recommended (AWS RDS, Neon, Supabase)
   - Minimum t3.small (2GB RAM)
   - Automatic backups enabled
   - Connection pooling configured

3. **Cache/Queue (Redis)**
   - Managed Redis recommended (AWS ElastiCache, Redis Cloud)
   - Minimum 1GB RAM
   - Persistence enabled (AOF + RDB)
   - Required for Bull job queue

4. **File Storage**
   - AWS S3 or compatible (R2, MinIO, DigitalOcean Spaces)
   - Bucket with private access
   - CORS configured for web uploads

5. **Email Service**
   - SendGrid (recommended)
   - Or any SMTP-compatible service
   - Sender domain verified

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your production values:

#### AI Services (REQUIRED)

```bash
# OpenAI for chat features
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Anthropic Claude for automation & tax suggestions
ANTHROPIC_API_KEY=sk-ant-...
```

#### Database (REQUIRED)

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/bluetradie

# Example for Neon:
# DATABASE_URL=postgresql://user:password@ep-name.region.aws.neon.tech/bluetradie?sslmode=require
```

#### Redis (REQUIRED)

```bash
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Alternative: Single URL format
REDIS_URL=redis://default:password@host:6379
```

#### Email & SMS (REQUIRED for email, OPTIONAL for SMS)

```bash
# SendGrid
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM_NAME=Blue Tradie
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# Twilio (optional - SMS features will be disabled if not present)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxx
```

#### File Storage (REQUIRED)

```bash
STORAGE_PROVIDER=s3
S3_BUCKET=your-bucket-name
S3_REGION=ap-southeast-2
S3_ACCESS_KEY_ID=AKIAXXXXX
S3_SECRET_ACCESS_KEY=xxxxx

# For R2 or other S3-compatible:
# S3_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
```

#### Application Settings (REQUIRED)

```bash
APP_URL=https://yourdomain.com
APP_DOMAIN=yourdomain.com
NODE_ENV=production

# Session configuration
SESSION_COOKIE_NAME=bt_sess
SESSION_TTL_DAYS=30
MAGIC_LINK_TTL_MINUTES=15

# Webhook security
WEBHOOK_SECRET_RANDOM=generate_random_32_character_string_here
```

#### Payments - Stripe (REQUIRED if using paid features)

```bash
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### Monitoring (OPTIONAL but RECOMMENDED)

```bash
# Sentry for error tracking
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
LOG_LEVEL=info
```

#### PWA Push Notifications (OPTIONAL)

Generate VAPID keys for web push:

```bash
npx web-push generate-vapid-keys
```

Then add to .env:

```bash
VAPID_PUBLIC_KEY=xxxxx
VAPID_PRIVATE_KEY=xxxxx
```

#### Business Information (AU/NZ Compliance)

```bash
BUSINESS_ABN=12345678901
BUSINESS_ADDRESS=123 Main St, Sydney NSW 2000
```

### 3. Security Checklist

Before going live:

- [ ] All API keys are production keys (not test/sandbox)
- [ ] `NODE_ENV=production` is set
- [ ] `APP_URL` matches your actual domain with HTTPS
- [ ] Database uses SSL connection (`?sslmode=require`)
- [ ] Redis has authentication enabled
- [ ] Webhook secret is cryptographically random (32+ chars)
- [ ] Sentry DSN configured for error monitoring
- [ ] File uploads have size limits configured
- [ ] Rate limiting values are appropriate for your scale

## Database Setup

### 1. Push Database Schema

Create all tables and indexes:

```bash
npm run db:push
```

This will create tables for:
- Users & authentication
- Jobs, quotes, invoices
- Customers & contacts
- Calendar & scheduling
- Documents & files
- Automation rules & executions
- Tax settings & BAS reports
- Team members & permissions

### 2. Seed Default Data

Populate tax categories and default data:

```bash
npm run db:seed
```

This adds:
- 14 ATO-compliant tax deduction categories
- Default tax settings structure

### 3. Verify Database

Connect to your database and verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check tax categories seeded
SELECT * FROM tax_categories WHERE is_default = true;
```

## Build & Deployment

### 1. Install Dependencies

```bash
npm ci --production=false
```

### 2. Build Application

```bash
npm run build
```

This creates:
- `dist/client/` - Static frontend assets
- `dist/server/index.js` - Bundled backend

### 3. Start Production Server

```bash
npm start
```

The server will:
- Start on port from `process.env.PORT` or default 5000
- Serve static files from `dist/client`
- Connect to PostgreSQL and Redis
- Initialize Bull job queue workers

### 4. Health Check

Verify the server is running:

```bash
curl https://yourdomain.com/health
```

Should return: `{"status":"ok"}`

## Platform-Specific Deployment

### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init -p node.js-20 blue-tradie

# Create environment
eb create blue-tradie-prod --database.engine postgres

# Set environment variables
eb setenv NODE_ENV=production \
  DATABASE_URL="postgresql://..." \
  OPENAI_API_KEY="sk-..." \
  # ... (add all required env vars)

# Deploy
eb deploy
```

### Heroku

```bash
# Create app
heroku create blue-tradie-prod

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY="sk-..."
# ... (add all required env vars)

# Deploy
git push heroku feature/full-stack-all-tracks:main
```

### DigitalOcean App Platform

1. Create new app from GitHub repository
2. Select branch: `feature/full-stack-all-tracks`
3. Add build command: `npm ci && npm run build`
4. Add run command: `npm start`
5. Add PostgreSQL database (Dev Database or Managed Database)
6. Add Redis cluster (Managed Redis)
7. Configure environment variables in App Platform dashboard
8. Deploy

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production=false

# Copy source
COPY . .

# Build
RUN npm run build

# Cleanup dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 5000

# Start
CMD ["npm", "start"]
```

```bash
# Build image
docker build -t blue-tradie:latest .

# Run container
docker run -d \
  -p 5000:5000 \
  --env-file .env \
  --name blue-tradie \
  blue-tradie:latest
```

### Docker Compose (Development/Testing)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    env_file: .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: bluetradie
      POSTGRES_USER: bluetradie
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
```

## Post-Deployment Checklist

### Immediate (Day 1)

- [ ] Verify app is accessible at production URL
- [ ] Test user registration flow
- [ ] Test magic link email delivery
- [ ] Verify file uploads work
- [ ] Check Sentry for any errors
- [ ] Monitor Redis connection (Bull queue)
- [ ] Verify database connections are stable

### Week 1

- [ ] Monitor error rates in Sentry
- [ ] Check API rate limiting is working
- [ ] Verify automation jobs execute on schedule
- [ ] Test mobile PWA installation
- [ ] Monitor database query performance
- [ ] Check Bull queue job processing times
- [ ] Verify email delivery rates (SendGrid dashboard)

### Ongoing

- [ ] Set up database backups (daily)
- [ ] Monitor disk usage (file uploads)
- [ ] Review Redis memory usage
- [ ] Check API response times
- [ ] Monitor AI API costs (OpenAI/Anthropic dashboards)
- [ ] Review security logs

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Auto-renewal cron (runs daily)
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

### Using Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/blue-tradie
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location /assets {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/blue-tradie /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoring & Maintenance

### Application Monitoring

1. **Sentry** - Error tracking and performance
   - Already integrated
   - Dashboard: https://sentry.io

2. **Log Management**
   - Application logs via `pino` logger
   - Consider: LogDNA, Datadog, CloudWatch

3. **Uptime Monitoring**
   - Recommended: UptimeRobot, Pingdom
   - Monitor: `/health` endpoint every 5 minutes

### Database Monitoring

```sql
-- Check connection count
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries (> 1 second)
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

-- Check table sizes
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Redis Monitoring

```bash
# Connect to Redis
redis-cli -h your-host -p 6379 -a your-password

# Check memory usage
INFO memory

# Check queue statistics
KEYS bull:*

# Monitor commands in real-time
MONITOR
```

## Backup Strategy

### Database Backups

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL > "$BACKUP_DIR/bluetradie_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/bluetradie_$DATE.sql"

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

Run daily via cron:
```bash
0 2 * * * /path/to/backup-db.sh
```

### File Storage Backups

S3 buckets have versioning built-in. Enable it:

```bash
aws s3api put-bucket-versioning \
  --bucket your-bucket-name \
  --versioning-configuration Status=Enabled
```

## Scaling Considerations

### Horizontal Scaling

To scale beyond a single server:

1. **Load Balancer** (AWS ALB, Nginx)
   - Distribute traffic across multiple app servers
   - Sticky sessions for websockets

2. **Shared Session Store**
   - Already using Redis for sessions ✓
   - Configure `connect-pg-simple` to use PostgreSQL

3. **Shared File Storage**
   - Already using S3 ✓

4. **Database Scaling**
   - Read replicas for reporting queries
   - Connection pooling (PgBouncer)

### Performance Optimization

1. **Enable CDN** for static assets
   - CloudFront, Cloudflare, Fastly
   - Cache `/assets/*` at edge

2. **Database Indexes**
   - Already created in schema ✓
   - Monitor slow queries and add as needed

3. **Redis Caching**
   - Cache frequently accessed data
   - Use Bull queue for async operations ✓

## Troubleshooting

### Server won't start

```bash
# Check logs
npm start 2>&1 | tee server.log

# Common issues:
# - Missing environment variables → Check .env
# - Database connection failed → Verify DATABASE_URL
# - Redis connection failed → Check REDIS_HOST/PORT/PASSWORD
# - Port already in use → Change PORT env var
```

### Database migration issues

```bash
# Reset and reapply
npm run db:push

# If tables exist but schema changed, drop and recreate:
# (⚠️ THIS WILL DELETE ALL DATA)
# DROP SCHEMA public CASCADE;
# CREATE SCHEMA public;
# npm run db:push
```

### Bull queue not processing jobs

```bash
# Check Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping

# Check queue
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD
> KEYS bull:automation:*

# Check worker logs for errors
```

### File uploads failing

```bash
# Check S3 permissions
aws s3 ls s3://your-bucket-name/

# Test upload
aws s3 cp test.txt s3://your-bucket-name/test.txt

# Verify CORS
aws s3api get-bucket-cors --bucket your-bucket-name
```

## Security Hardening

### Production Security Checklist

- [ ] HTTPS enabled with valid certificate
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting active on all endpoints
- [ ] File upload validation with magic numbers
- [ ] SQL injection protection (using Drizzle ORM parameterized queries)
- [ ] XSS protection (React escapes by default)
- [ ] CSRF tokens for state-changing operations
- [ ] API keys in environment variables (never committed)
- [ ] Database credentials rotated regularly
- [ ] Backup encryption enabled
- [ ] Error messages don't leak sensitive info
- [ ] Dependency security audits (`npm audit`)

### Regular Security Updates

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Major version updates
npm outdated
```

## Support & Resources

- **Documentation**: See README.md
- **Issues**: https://github.com/cyruskhenry333-hub/blue-tradie/issues
- **Email**: support@bluetradie.com

## License

Proprietary - Blue Tradie Platform
