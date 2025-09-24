# Blue Tradie UX Checklist

This document tracks all acceptance criteria across the development tasks to ensure nothing is missed.

## TASK 0 — Preflight & Tracking Doc
- [ ] Create `docs/ux-checklist.md` containing all acceptance criteria with checkboxes
- [ ] Verify ENV placeholders in README for Stripe, SendGrid, Twilio, APP_URL
- [ ] Run `npm run typecheck && npm run build` and record any issues
- [ ] PR includes the doc and passes typecheck/build

## TASK 1 — Homepage QA & Polish

### CTAs Audit (Desktop/Mobile)
- [ ] Header "Start Free Month" routes to `/signup?plan=pro`
- [ ] Hero "Start Free Month" routes to `/signup?plan=pro` 
- [ ] Banner CTA routes to `/signup?plan=pro`
- [ ] Final CTA button routes to `/signup?plan=pro`
- [ ] All CTAs work on mobile breakpoints

### Pricing Modal
- [ ] Two cards only: **Pro $59** and **Teams $149**
- [ ] Header copy: "First month free"
- [ ] Remove "Everything in Free" text (no separate free plan)
- [ ] Pro button routes to `/signup?plan=pro`
- [ ] Teams button routes to `/signup?plan=teams`

### Final CTA Section
- [ ] Section background is neutral (`bg-gray-50` or equivalent)
- [ ] Strong gradient only on primary button
- [ ] Section reads well on neutral background

### Navigation
- [ ] Remove "Roadmap" from header navigation
- [ ] Add small footer link "Changelog & Roadmap" → `/roadmap`
- [ ] Keep existing roadmap route functional

### Copy & Localization
- [ ] AU/NZ appropriate language throughout
- [ ] GST badges accurate (AU 10%, NZ 15%)
- [ ] Copy flows naturally for target audience

### Analytics
- [ ] Track `cta_start_free_month` events
- [ ] Include `{ plan, placement: "header|hero|banner|final|modal" }` data
- [ ] Events fire correctly from all CTA locations

### Accessibility & Mobile
- [ ] Keyboard focus states on all interactive elements
- [ ] Alt text on all images
- [ ] ARIA labels on modal
- [ ] All breakpoints work correctly
- [ ] Mobile navigation functional

### Build Quality
- [ ] Typecheck passes
- [ ] Lint passes  
- [ ] Build passes
- [ ] PR contains before/after screenshots
- [ ] PR contains detailed test steps

## TASK 2 — Signup Flow (Single Screen → Stripe Checkout)

### Frontend Signup Form
- [ ] `/signup` has minimal fields: email, password, businessName (optional), phone, country
- [ ] **smsOptIn** checkbox present and functional
- [ ] Reads `plan` from query parameter (defaults to `pro`)
- [ ] Shows badge "Starting Pro/Teams free month" based on plan
- [ ] Form validation using zod + React Hook Form
- [ ] Accessibility compliance

### Stripe Integration
- [ ] Submit → POST `/api/checkout/start-trial` with correct payload
- [ ] Redirects to Stripe Checkout `session.url`
- [ ] Legal line under button: "30-day free trial. Card charged on day 31 unless canceled. Up to 3 reminder emails/SMS. Reply STOP to opt out."

### Backend Implementation
- [ ] POST `/api/checkout/start-trial` endpoint implemented
- [ ] Uses Stripe Checkout with `mode=subscription`, `trial_period_days=30`
- [ ] Prices from env: `STRIPE_PRICE_PRO_MONTH`, `STRIPE_PRICE_TEAMS_MONTH`
- [ ] `success_url=${APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`
- [ ] `cancel_url=${APP_URL}/signup?plan=${plan}`

### Webhooks
- [ ] `checkout.session.completed` → upsert user, store `stripe_customer_id`
- [ ] `customer.subscription.created/updated` → store `stripe_subscription_id`, `plan`, `trial_end`
- [ ] Webhook handlers are idempotent

### Billing Portal
- [ ] GET `/api/billing/portal` returns Stripe portal URL
- [ ] Portal accessible to authenticated users

### Database Schema
- [ ] Add `plan` enum('pro','teams') column
- [ ] Add `stripe_customer_id` column
- [ ] Add `stripe_subscription_id` column  
- [ ] Add `trial_end` timestamp column
- [ ] Add `phone` column
- [ ] Add `sms_opt_in` boolean column
- [ ] Migration is safe (no data loss)

### Acceptance Testing
- [ ] Choose plan → `/signup` → submit → Checkout opens
- [ ] Card required in Checkout
- [ ] Returns to `/welcome` on success
- [ ] DB stores subscription + `trial_end` correctly
- [ ] Build/typecheck/lint pass
- [ ] PR has test steps + screenshots

## TASK 3 — Trial Reminders (Email + SMS)

### Reminder System
- [ ] Daily job identifies users by `trial_end` for D-10/3/1 reminders
- [ ] Email sent via SendGrid
- [ ] SMS sent via Twilio (honors `sms_opt_in`)
- [ ] Store `last_reminder_sent` (date + type) to avoid duplicates

### Templates & Content
- [ ] Email subject lines as per spec
- [ ] SMS bodies as per spec  
- [ ] Include links to cancel/billing portal
- [ ] "Manage billing" links functional
- [ ] "Cancel trial" links functional

### Job Configuration
- [ ] Dry-run task logs correct candidates
- [ ] One email + optional SMS per checkpoint
- [ ] No duplicate sends
- [ ] Cron/worker setup documented
- [ ] PR includes config docs + cron instructions

## TASK 4 — Onboarding Wizard

### Multi-Step Wizard
- [ ] Progress indicator functional
- [ ] Step 1: Business details (trade, GST, region)
- [ ] Step 2: Preferences (AI advisors toggles)  
- [ ] Step 3: Directory profile (name, service area, short bio) — optional
- [ ] Step 4: First success action (create invoice OR connect integration)

### UX Features
- [ ] Persist partial progress between steps
- [ ] Skip functionality works
- [ ] Back button works
- [ ] Works on mobile devices
- [ ] When finished → redirects to `/dashboard`

### Flow Testing
- [ ] Wizard loads from `/welcome` post-Checkout
- [ ] Data saves between steps correctly
- [ ] Skip works without breaking flow
- [ ] E2E happy path lands on dashboard successfully

## TASK 5 — Core UX Functionality QA

### Authentication
- [ ] Login flow works
- [ ] Logout works  
- [ ] Password reset functional

### Dashboard
- [ ] Dashboard loads without errors
- [ ] Key metrics display correctly
- [ ] Navigation works

### Invoicing & Quotes
- [ ] Create invoice works
- [ ] Send invoice works
- [ ] AU GST calculation correct (10%)
- [ ] NZ GST calculation correct (15%)
- [ ] Totals render correctly

### Directory
- [ ] Search/list functionality works
- [ ] Send referral works
- [ ] Profile view works
- [ ] Profile edit works

### AI Advisors
- [ ] Send messages works
- [ ] Receive messages works
- [ ] Error handling graceful

### Automation
- [ ] Create simple rule works
- [ ] Verify trigger (or stub with logs)

### Billing
- [ ] Open portal works
- [ ] Cancel subscription works
- [ ] Status reflects in app correctly

### Mobile Responsiveness
- [ ] Key screens work on mobile
- [ ] Navigation functional on mobile
- [ ] Forms work on mobile

### Documentation
- [ ] Manual test steps recorded in this checklist
- [ ] Issues fixed or tracked
- [ ] Summary PR links all related PRs

## TASK 6 — Instrumentation, A11y, Performance

### Analytics
- [ ] Analytics events fire across key CTAs
- [ ] Signup funnel events tracked
- [ ] Event data structure correct

### Accessibility
- [ ] Landmarks properly defined
- [ ] Labels on form elements
- [ ] Color contrast meets standards
- [ ] Focus management works
- [ ] No obvious a11y violations

### Performance
- [ ] Heavy assets lazy-loaded
- [ ] Images audited and optimized
- [ ] Basic Lighthouse targets met
- [ ] Performance reasonable on mobile

### Quality Metrics
- [ ] Events fire correctly
- [ ] Lighthouse scores reasonable
- [ ] A11y audit passes

---

## Test Environment Setup

### Required Environment Variables
- [ ] `STRIPE_SECRET_KEY` configured
- [ ] `STRIPE_PRICE_PRO_MONTH` configured  
- [ ] `STRIPE_PRICE_TEAMS_MONTH` configured
- [ ] `SENDGRID_API_KEY` configured
- [ ] `TWILIO_ACCOUNT_SID` configured
- [ ] `TWILIO_AUTH_TOKEN` configured
- [ ] `TWILIO_PHONE_NUMBER` configured
- [ ] `APP_URL` configured
- [ ] Database connection working

### Test Data
- [ ] Test Stripe products/prices created
- [ ] Test customer accounts available
- [ ] Email/SMS test endpoints configured

---

## Deployment Checklist

### Pre-Deploy
- [ ] All environment variables set on production
- [ ] Database migrations run
- [ ] Build passes
- [ ] Tests pass
- [ ] Security review complete

### Post-Deploy
- [ ] Health check passes
- [ ] Key user flows tested on production
- [ ] Analytics firing
- [ ] Error monitoring active
- [ ] Rollback plan ready

---

*Last updated: Task 0 setup*
*Next update: After each task completion*