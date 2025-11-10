# Blue Tradie - Complete Codebase Overview & Technical Handoff

> **Purpose**: This document provides a comprehensive technical overview of the Blue Tradie platform for AI development assistants and developers. It covers architecture, implementation details, code organization, and design decisions.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Database Schema](#database-schema)
4. [Codebase Structure](#codebase-structure)
5. [Feature Implementation Details](#feature-implementation-details)
6. [API Architecture](#api-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Security Implementation](#security-implementation)
9. [Background Jobs & Queue System](#background-jobs--queue-system)
10. [AI Integration](#ai-integration)
11. [Key Files Reference](#key-files-reference)
12. [Design Patterns & Conventions](#design-patterns--conventions)
13. [Development Workflow](#development-workflow)

---

## Project Overview

### What is Blue Tradie?

Blue Tradie is a **comprehensive business management platform** specifically designed for Australian tradies (plumbers, electricians, builders, etc.). It combines:
- Traditional business management (jobs, invoices, quotes, customers)
- AI-powered automation and assistance
- Australian tax compliance (GST, BAS reporting)
- Mobile-first PWA capabilities
- Team collaboration features

### Business Problem Solved

Australian tradies struggle with:
1. **Administrative burden**: Paperwork takes time away from actual work
2. **Tax compliance**: BAS reporting, GST calculations, deduction tracking is complex
3. **Cash flow management**: Late payments, unclear financials
4. **Customer communication**: Follow-ups, review requests, job updates
5. **Mobile work**: Need access to data on job sites without internet

### Solution Provided

Blue Tradie automates these tasks while being:
- **Mobile-first**: PWA that works offline
- **AI-powered**: Chatbot, automation, tax suggestions
- **Compliant**: Australian tax rules built-in
- **Simple**: Designed for non-technical users

---

## Architecture & Tech Stack

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client (React PWA)                │
│  - React 18 + TypeScript                           │
│  - Service Worker (offline support)                │
│  - TanStack Query (state management)               │
│  - Tailwind CSS + shadcn/ui                        │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTPS / REST API
                  │
┌─────────────────▼───────────────────────────────────┐
│              Express Server (Node.js)               │
│  - Express 4.x                                      │
│  - Session-based auth (HTTP-only cookies)          │
│  - Rate limiting middleware                         │
│  - File upload validation                          │
└─────┬──────────┬──────────┬────────────┬───────────┘
      │          │          │            │
      ▼          ▼          ▼            ▼
┌─────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│PostgreSQL│ │ Redis  │ │AWS S3  │ │ OpenAI   │
│Database  │ │Cache + │ │File    │ │Anthropic │
│         │ │Queue   │ │Storage │ │APIs      │
└─────────┘ └────────┘ └────────┘ └──────────┘
```

### Technology Stack

#### Frontend
- **React 18.3.1** - UI library with concurrent rendering
- **TypeScript 5.6.3** - Type safety
- **Vite 5.4** - Fast build tool and dev server
- **TanStack Query 5.60** - Server state management, caching, and mutations
- **Wouter 3.3** - Lightweight client-side routing (~1KB)
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - Accessible component library built on Radix UI
- **Framer Motion 11.13** - Animation library
- **Recharts 2.15** - Charts for business insights

#### Backend
- **Node.js 20.x** - Runtime environment
- **Express 4.21** - Web framework
- **TypeScript (ESM)** - ES modules with type safety
- **Drizzle ORM 0.39** - Type-safe SQL query builder
- **PostgreSQL 14+** - Primary database
- **Redis 6+** - Caching and job queue
- **Bull 4.16** - Background job processing

#### AI & External Services
- **OpenAI GPT-4o-mini** - AI chat assistant for business queries
- **Anthropic Claude Sonnet** - Automation engine and tax suggestions
- **SendGrid** - Transactional email delivery
- **Twilio** - SMS notifications (optional)
- **Stripe** - Payment processing

#### DevOps & Monitoring
- **Sentry** - Error tracking and performance monitoring
- **Sharp** - Image processing for PWA icons
- **ESBuild** - Server bundling for production

### Why These Choices?

**React + TypeScript**: Industry standard, excellent type safety, large ecosystem

**Drizzle ORM**: Chosen over Prisma because:
- Lighter weight
- Better PostgreSQL-specific features
- Type inference from schema (not codegen)
- Direct SQL control when needed

**Bull + Redis**: Production-grade job queue that:
- Persists jobs across server restarts
- Automatic retries with exponential backoff
- Job monitoring and failure handling
- Scales horizontally

**TanStack Query**: Better than Redux because:
- Built for async server state
- Automatic caching and invalidation
- Optimistic updates
- Less boilerplate

---

## Database Schema

### Overview

The database uses **PostgreSQL** with a schema defined in `shared/schema.ts` using Drizzle ORM. All tables follow these conventions:
- `id` - Auto-incrementing primary key
- `createdAt` - Timestamp (default: now)
- `updatedAt` - Timestamp (auto-updated)
- `userId` - Foreign key to users table (ownership)

### Core Tables

#### 1. **users** - User accounts and authentication
```typescript
{
  id: serial,
  email: varchar (unique, indexed),
  businessName: varchar,
  firstName: varchar,
  lastName: varchar,
  phone: varchar,
  abn: varchar, // Australian Business Number
  address: text,
  isOnboarded: boolean,
  createdAt: timestamp
}
```

**Purpose**: Store user authentication and business profile data. Each user represents one tradie business.

**Key Points**:
- Email is used for magic link authentication
- ABN required for GST-registered businesses
- `isOnboarded` tracks if user completed setup

#### 2. **customers** - Customer/client records
```typescript
{
  id: serial,
  userId: integer (FK -> users),
  businessName: varchar,
  firstName: varchar,
  lastName: varchar,
  email: varchar,
  phone: varchar,
  address: text,
  suburb: varchar,
  postcode: varchar,
  state: varchar,
  tags: text[],
  notes: text,
  source: varchar, // How they found you
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: CRM system for managing customer contacts and details.

**Indexes**: `userId`, `email` for fast lookups

#### 3. **jobs** - Work projects from quote to completion
```typescript
{
  id: serial,
  userId: integer (FK -> users),
  customerId: integer (FK -> customers),
  title: varchar,
  description: text,
  status: varchar, // pending, in-progress, completed, cancelled
  jobType: varchar, // installation, repair, maintenance, renovation
  priority: varchar, // low, medium, high, urgent
  startDate: date,
  dueDate: date,
  completedDate: date,
  estimatedHours: decimal,
  actualHours: decimal,
  estimatedCost: decimal,
  actualCost: decimal,
  address: text,
  suburb: varchar,
  postcode: varchar,
  state: varchar,
  notes: text,
  tags: text[],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: Track jobs from initial quote through completion, including time tracking and cost estimation.

**Key Workflow**:
1. Quote accepted → Create job with `status: pending`
2. Work starts → Update to `in-progress`
3. Work done → Mark `completed` with actual hours/cost
4. Generate invoice from completed job

**Indexes**: `userId`, `customerId`, `status` for filtering

#### 4. **invoices** - Billing documents
```typescript
{
  id: serial,
  userId: integer (FK -> users),
  customerId: integer (FK -> customers),
  jobId: integer (FK -> jobs, nullable),
  invoiceNumber: varchar (unique), // INV-2025-001
  status: varchar, // draft, sent, paid, overdue, cancelled
  issueDate: date,
  dueDate: date,
  subtotal: decimal,
  gst: decimal, // 10% GST (calculated as subtotal ÷ 11)
  total: decimal,
  amountPaid: decimal,
  paymentMethod: varchar,
  paidAt: timestamp,
  notes: text,
  items: jsonb[], // Line items array
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: Generate and track invoices with Australian GST compliance.

**GST Calculation**:
- Subtotal = sum of all items
- GST = subtotal × (1/11) = 10% of total
- Total = subtotal + GST

**Invoice Number Format**: `INV-{YEAR}-{SEQUENCE}`

#### 5. **quotes** - Price estimates for customers
```typescript
{
  id: serial,
  userId: integer (FK -> users),
  customerId: integer (FK -> customers),
  quoteNumber: varchar (unique), // QTE-2025-001
  status: varchar, // draft, sent, accepted, declined, expired
  title: varchar,
  description: text,
  validUntil: date,
  subtotal: decimal,
  gst: decimal,
  total: decimal,
  items: jsonb[],
  notes: text,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: Create quotes before work begins. Once accepted, can convert to job.

**Workflow**: Draft → Send → Customer accepts → Convert to job → Invoice after completion

#### 6. **expenses** - Business expense tracking
```typescript
{
  id: serial,
  userId: integer (FK -> users),
  jobId: integer (FK -> jobs, nullable),
  categoryId: integer (FK -> tax_categories),
  amount: decimal,
  gst: decimal,
  description: text,
  vendor: varchar,
  expenseDate: date,
  paymentMethod: varchar,
  receiptUrl: varchar, // S3 path to receipt image
  isDeductible: boolean,
  notes: text,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: Track expenses for tax deductions and job costing.

**Tax Flow**:
1. Expense recorded with receipt
2. AI suggests tax category and deductibility
3. User confirms
4. Included in quarterly BAS report

#### 7. **automation_rules** - Workflow automation configuration
```typescript
{
  id: serial,
  userId: integer (FK -> users),
  name: varchar,
  description: text,
  triggerType: varchar, // job_completed, invoice_sent, invoice_paid, quote_sent
  triggerConditions: jsonb, // Additional conditions
  actionType: varchar, // send_email, send_sms, request_review, create_task
  actionConfig: jsonb, // Action-specific config
  isActive: boolean,
  executionCount: integer,
  lastExecutedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: Define automated workflows that trigger on business events.

**Example Rule**:
```json
{
  "triggerType": "job_completed",
  "actionType": "request_review",
  "actionConfig": {
    "delayHours": 48,
    "platform": "google",
    "emailTemplate": "review_request"
  }
}
```

**Execution Flow**:
1. Event occurs (e.g., job completed)
2. Engine finds matching rules
3. Job added to Bull queue with delay
4. Worker executes action (sends email/SMS)
5. Result logged in `automation_executions`

#### 8. **automation_executions** - Automation execution history
```typescript
{
  id: serial,
  ruleId: integer (FK -> automation_rules),
  userId: integer (FK -> users),
  triggeredAt: timestamp,
  executedAt: timestamp,
  status: varchar, // success, failed, pending
  context: jsonb, // Trigger context (job data, customer data)
  result: jsonb, // Execution result
  errorMessage: text,
  createdAt: timestamp
}
```

**Purpose**: Audit log of all automation executions for debugging and analytics.

#### 9. **review_requests** - Customer review tracking
```typescript
{
  id: serial,
  userId: integer (FK -> users),
  customerId: integer (FK -> customers),
  jobId: integer (FK -> jobs),
  platform: varchar, // google, facebook, productreview
  requestedAt: timestamp,
  clickedAt: timestamp,
  completedAt: timestamp,
  rating: integer, // 1-5
  comment: text,
  token: varchar (unique, indexed), // Unique token for tracking
  createdAt: timestamp
}
```

**Purpose**: Track review request campaigns to measure effectiveness.

**Flow**:
1. Automation sends review request email
2. Email contains link: `https://app.com/review/{token}`
3. Customer clicks → `clickedAt` recorded
4. Customer leaves review → `completedAt` and `rating` recorded
5. Analytics show conversion rates

#### 10. **tax_settings** - User tax configuration
```typescript
{
  id: serial,
  userId: integer (FK -> users, unique),
  gstRegistered: boolean,
  abn: varchar,
  financialYearEnd: varchar, // "30-06" (June 30)
  accountingBasis: varchar, // accrual, cash
  basReportingPeriod: varchar, // monthly, quarterly
  gstRate: decimal, // "10.00"
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: Store user-specific tax settings for Australian compliance.

**Key Points**:
- GST registration threshold in Australia: $75,000 annual turnover
- Most tradies use quarterly BAS reporting
- Financial year: July 1 - June 30

#### 11. **bas_reports** - Business Activity Statement reports
```typescript
{
  id: serial,
  userId: integer (FK -> users),
  quarter: varchar, // "Q1 2025", "Q2 2025"
  startDate: date,
  endDate: date,
  status: varchar, // draft, submitted, paid
  totalSales: decimal,
  gstOnSales: decimal,
  totalPurchases: decimal,
  gstOnPurchases: decimal,
  netGst: decimal, // gstOnSales - gstOnPurchases
  submittedAt: timestamp,
  paidAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: Generate quarterly BAS reports required by Australian Tax Office.

**BAS Calculation**:
```
Sales (from invoices) = $45,000
GST on sales = $45,000 ÷ 11 = $4,091
Purchases (from expenses) = $12,000
GST on purchases = $12,000 ÷ 11 = $1,091
Net GST owed = $4,091 - $1,091 = $3,000
```

**Quarters** (Australian financial year):
- Q1: July - September
- Q2: October - December
- Q3: January - March
- Q4: April - June

#### 12. **tax_categories** - Deduction categories
```typescript
{
  id: serial,
  name: varchar,
  description: text,
  category: varchar, // vehicle, tools, materials, insurance, etc.
  deductible: boolean,
  deductionRate: decimal, // "100.00" or partial like "50.00"
  atoCategory: varchar, // ATO reference code
  requiresReceipt: boolean,
  isDefault: boolean, // System-provided category
  userId: integer (FK -> users, nullable), // null for default categories
  createdAt: timestamp
}
```

**Purpose**: Categorize expenses for tax deductions according to ATO rules.

**Default Categories** (seeded in database):
1. Vehicle Expenses (100% deductible, requires receipts)
2. Tools & Equipment (100% deductible)
3. Materials & Supplies (100% deductible)
4. Insurance (100% deductible)
5. Phone & Internet (50% deductible for personal use)
6. Home Office (percentage based on business use)
7. Marketing & Advertising (100% deductible)
8. Professional Development (100% deductible)
9. Uniforms & Safety Gear (100% deductible)
10. Accounting & Legal Fees (100% deductible)
11. Bank Fees (100% deductible)
12. Depreciation (varies)
13. Subcontractors (100% deductible)
14. Rent & Lease (100% deductible)

#### 13. **tax_deductions** - AI-suggested deductions
```typescript
{
  id: serial,
  userId: integer (FK -> users),
  expenseId: integer (FK -> expenses),
  categoryId: integer (FK -> tax_categories),
  suggestedAmount: decimal,
  confidence: varchar, // high, medium, low
  reasoning: text, // AI explanation
  atoReference: varchar, // Tax ruling reference
  status: varchar, // pending, accepted, dismissed
  userNotes: text,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: AI-powered tax deduction suggestions that users can accept or dismiss.

**AI Flow**:
1. User uploads expense receipt
2. AI (Claude) analyzes expense details
3. Suggests appropriate tax category
4. Provides reasoning and ATO reference
5. User accepts → Applied to BAS report

#### 14. **documents** - File management
```typescript
{
  id: serial,
  userId: integer (FK -> users),
  documentType: varchar, // receipt, invoice, contract, photo, quote
  jobId: integer (FK -> jobs, nullable),
  invoiceId: integer (FK -> invoices, nullable),
  quoteId: integer (FK -> quotes, nullable),
  expenseId: integer (FK -> expenses, nullable),
  title: varchar,
  description: text,
  originalFileName: varchar,
  fileSize: integer, // bytes
  mimeType: varchar,
  storageProvider: varchar, // s3, local
  storagePath: varchar, // S3 key or local path
  isPublic: boolean,
  category: varchar,
  tags: text[],
  uploadedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: Store and organize business documents with S3 storage.

**Security**:
- File validation with magic numbers (not just MIME type)
- Filename sanitization to prevent path traversal
- Size limits (default 10MB)
- Virus scanning ready (integration points documented)

#### 15. **document_access_logs** - Document access audit trail
```typescript
{
  id: serial,
  documentId: integer (FK -> documents),
  userId: integer (FK -> users),
  action: varchar, // view, download, share, delete
  ipAddress: varchar,
  userAgent: text,
  metadata: jsonb,
  createdAt: timestamp
}
```

**Purpose**: Audit trail for compliance and security monitoring.

#### 16. **calendar_events** - Scheduling and appointments
```typescript
{
  id: serial,
  userId: integer (FK -> users),
  jobId: integer (FK -> jobs, nullable),
  customerId: integer (FK -> customers, nullable),
  teamMemberId: integer (FK -> team_members, nullable),
  title: varchar,
  description: text,
  startTime: timestamp,
  endTime: timestamp,
  allDay: boolean,
  eventType: varchar, // job, meeting, appointment, reminder
  location: text,
  color: varchar, // Hex color for calendar display
  recurringRule: varchar, // RRULE format
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: Manage schedules, job assignments, and appointments.

**Integration**: Links to jobs for automatic schedule creation when job dates are set.

#### 17. **team_members** - Employee management
```typescript
{
  id: serial,
  userId: integer (FK -> users), // Business owner
  email: varchar,
  firstName: varchar,
  lastName: varchar,
  role: varchar, // admin, manager, technician, apprentice
  permissions: text[], // Array of permission strings
  isActive: boolean,
  invitedAt: timestamp,
  joinedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Purpose**: Multi-user support for businesses with employees.

**Permissions**: Role-based access control (RBAC)
- `view_jobs`, `edit_jobs`, `delete_jobs`
- `view_invoices`, `create_invoices`
- `view_customers`, `edit_customers`
- `view_reports`, `manage_team`

### Database Relationships

```
users (1) ──< (many) customers
users (1) ──< (many) jobs
users (1) ──< (many) invoices
users (1) ──< (many) expenses
users (1) ──< (many) automation_rules
users (1) ── (1) tax_settings

customers (1) ──< (many) jobs
customers (1) ──< (many) invoices
customers (1) ──< (many) quotes

jobs (1) ──< (many) invoices
jobs (1) ──< (many) documents
jobs (1) ──< (many) calendar_events

automation_rules (1) ──< (many) automation_executions
automation_rules (1) ──< (many) review_requests

tax_categories (1) ──< (many) expenses
tax_categories (1) ──< (many) tax_deductions

documents (1) ──< (many) document_access_logs
```

### Indexes

All foreign keys are indexed. Additional indexes:

```sql
-- Fast user lookups
CREATE INDEX idx_users_email ON users(email);

-- Job filtering
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_customer ON jobs(customerId);

-- Invoice filtering
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_customer ON invoices(customerId);

-- Date range queries for BAS
CREATE INDEX idx_invoices_issue_date ON invoices(issueDate);
CREATE INDEX idx_expenses_expense_date ON expenses(expenseDate);

-- Calendar queries
CREATE INDEX idx_calendar_start_time ON calendar_events(startTime);
CREATE INDEX idx_calendar_user_date ON calendar_events(userId, startTime);

-- Document lookups
CREATE INDEX idx_documents_user_type ON documents(userId, documentType);
CREATE INDEX idx_documents_job ON documents(jobId);
```

---

## Codebase Structure

### Directory Layout

```
blue-tradie/
│
├── client/                          # Frontend React application
│   ├── public/                      # Static assets
│   │   ├── manifest.json           # PWA manifest
│   │   ├── sw.js                   # Service worker
│   │   ├── icon-*.png              # PWA icons (generated)
│   │   └── ICONS-README.md         # Icon documentation
│   │
│   └── src/
│       ├── components/             # Reusable UI components
│       │   ├── ui/                # shadcn/ui components
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   └── ... (40+ components)
│       │   │
│       │   ├── AIVirtualAssistant.tsx      # AI chat interface
│       │   ├── ErrorBoundary.tsx           # Error handling
│       │   ├── JobCard.tsx                 # Job display
│       │   ├── InvoiceGenerator.tsx        # Invoice creation
│       │   ├── QuickAccessPanel.tsx        # Quick actions
│       │   └── ... (50+ components)
│       │
│       ├── pages/                  # Route components
│       │   ├── dashboard.tsx      # Main dashboard
│       │   ├── jobs.tsx           # Jobs list/management
│       │   ├── invoices.tsx       # Invoice management
│       │   ├── customers.tsx      # CRM
│       │   ├── calendar.tsx       # Scheduling
│       │   ├── expenses.tsx       # Expense tracking
│       │   ├── tax.tsx            # Tax/BAS reporting
│       │   ├── automation.tsx     # Automation rules
│       │   ├── documents.tsx      # File management
│       │   ├── ai-advisors.tsx    # AI chat
│       │   ├── voice-quote.tsx    # Voice input
│       │   └── ... (40+ pages)
│       │
│       ├── hooks/                  # Custom React hooks
│       │   ├── useAuth.ts         # Authentication
│       │   ├── useJobs.ts         # Job data fetching
│       │   ├── useInvoices.ts     # Invoice operations
│       │   ├── useVoiceInput.ts   # Voice recognition
│       │   └── ...
│       │
│       ├── lib/                    # Utilities
│       │   ├── queryClient.ts     # TanStack Query config
│       │   ├── api.ts             # API client
│       │   └── utils.ts           # Helper functions
│       │
│       ├── utils/                  # PWA utilities
│       │   └── pwa.ts             # Service worker registration
│       │
│       ├── App.tsx                 # Root component with routing
│       ├── main.tsx                # Entry point
│       ├── index.css               # Global styles
│       └── sentry.ts               # Error monitoring setup
│
├── server/                          # Backend Node.js application
│   ├── routes/                     # API route handlers
│   │   ├── auth-api.ts            # Authentication (magic link)
│   │   ├── jobs-api.ts            # Job CRUD operations
│   │   ├── invoices-api.ts        # Invoice management
│   │   ├── customers-api.ts       # Customer management
│   │   ├── quotes-api.ts          # Quote generation
│   │   ├── expenses-api.ts        # Expense tracking
│   │   ├── calendar-api.ts        # Scheduling
│   │   ├── documents-api.ts       # File upload/download
│   │   ├── automation-api.ts      # Automation rules
│   │   ├── accounting-api.ts      # Tax/BAS endpoints
│   │   ├── team-api.ts            # Team management
│   │   └── ai-api.ts              # AI chat
│   │
│   ├── services/                   # Business logic layer
│   │   ├── jobService.ts          # Job operations
│   │   ├── invoiceService.ts      # Invoice generation
│   │   ├── documentService.ts     # File management
│   │   ├── automationEngine.ts    # Automation orchestration
│   │   ├── accountingService.ts   # Tax calculations
│   │   ├── queueService.ts        # Bull queue management
│   │   ├── emailService.ts        # Email sending
│   │   ├── smsService.ts          # SMS (Twilio)
│   │   └── aiService.ts           # OpenAI/Anthropic wrapper
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── auth.ts                # Authentication check
│   │   ├── ai-rate-limit.ts       # Rate limiting
│   │   └── file-security.ts       # File upload validation
│   │
│   ├── workers/                    # Background job workers
│   │   └── automationWorker.ts    # Process automation jobs
│   │
│   ├── db/                         # Database utilities
│   │   ├── index.ts               # Database connection
│   │   └── seed.ts                # Database seeding
│   │
│   └── index.ts                    # Server entry point
│
├── shared/                          # Shared code (client + server)
│   └── schema.ts                   # Drizzle schema definitions
│
├── scripts/                         # Build and utility scripts
│   └── generate-icons.js           # PWA icon generation
│
├── db/                              # Database migrations (legacy)
│   └── push.ts                     # Schema push script
│
├── .env.example                     # Environment variable template
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite build configuration
├── tailwind.config.js               # Tailwind CSS config
│
├── README.md                        # Project documentation
├── DEPLOYMENT.md                    # Deployment guide
├── API.md                           # API reference
└── CODEBASE_OVERVIEW.md            # This file
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `JobCard.tsx`)
- **Pages**: kebab-case (e.g., `voice-quote.tsx`)
- **Services**: camelCase (e.g., `automationEngine.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useJobs.ts`)
- **Types**: PascalCase interfaces/types in same file as component/service

---

## Feature Implementation Details

### 1. Authentication System

**Location**: `server/routes/auth-api.ts`

**How it works**:
1. User enters email on login page
2. Backend generates magic link token (JWT)
3. Email sent via SendGrid with link: `https://app.com/auth/verify?token={token}`
4. User clicks link
5. Token validated, session created (HTTP-only cookie)
6. Redirect to dashboard

**Session Management**:
- Uses `express-session` with PostgreSQL store (`connect-pg-simple`)
- Session cookie: `bt_sess` (HTTP-only, Secure in production)
- TTL: 30 days (configurable via `SESSION_TTL_DAYS`)

**Security**:
- No passwords stored
- Tokens expire after 15 minutes
- Sessions are server-side (not JWT client-side)
- CSRF protection via SameSite cookies

**Code Example**:
```typescript
// server/routes/auth-api.ts
app.post("/api/auth/magic-link", async (req, res) => {
  const { email } = req.body;

  // Create or find user
  let user = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user[0]) {
    user = await db.insert(users).values({ email }).returning();
  }

  // Generate token (JWT)
  const token = jwt.sign({ userId: user[0].id }, JWT_SECRET, { expiresIn: '15m' });

  // Send email
  await emailService.sendMagicLink(email, token);

  res.json({ message: "Magic link sent" });
});

app.get("/api/auth/verify", async (req, res) => {
  const { token } = req.query;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.session.userId = payload.userId;
    res.redirect("/dashboard");
  } catch (error) {
    res.redirect("/login?error=invalid_token");
  }
});
```

### 2. Job Management System

**Location**: `server/services/jobService.ts`, `server/routes/jobs-api.ts`

**Lifecycle**:
```
Quote Sent → Quote Accepted → Job Created (pending)
  → Job Started (in-progress) → Job Completed
  → Invoice Generated → Payment Received
```

**Key Features**:
- **Time tracking**: Estimated vs actual hours
- **Cost tracking**: Estimated vs actual cost
- **Address parsing**: Suburb, postcode, state for mapping
- **Tagging**: Flexible categorization
- **Job types**: Installation, repair, maintenance, renovation
- **Priority levels**: Low, medium, high, urgent

**API Endpoints**:
```typescript
GET    /api/jobs                    // List all jobs
POST   /api/jobs                    // Create job
GET    /api/jobs/:id                // Get job details
PATCH  /api/jobs/:id                // Update job
DELETE /api/jobs/:id                // Delete job
GET    /api/jobs/:id/timeline       // Job activity history
POST   /api/jobs/:id/complete       // Mark complete
```

**Code Example**:
```typescript
// server/services/jobService.ts
export class JobService {
  async createJob(userId: string, data: InsertJob) {
    // Create job
    const [job] = await db.insert(jobs).values({
      userId,
      ...data,
      status: 'pending'
    }).returning();

    // Auto-create calendar event if dates provided
    if (data.startDate) {
      await calendarService.createEvent({
        userId,
        jobId: job.id,
        title: job.title,
        startTime: data.startDate,
        eventType: 'job'
      });
    }

    return job;
  }

  async completeJob(jobId: number, userId: string, data: { actualHours, actualCost }) {
    const [job] = await db
      .update(jobs)
      .set({
        status: 'completed',
        completedDate: new Date(),
        actualHours: data.actualHours,
        actualCost: data.actualCost
      })
      .where(and(eq(jobs.id, jobId), eq(jobs.userId, userId)))
      .returning();

    // Trigger automation (follow-up email, review request)
    await automationEngine.processTrigger('job_completed', { userId, job });

    return job;
  }
}
```

### 3. Invoice System with GST

**Location**: `server/services/invoiceService.ts`, `server/routes/invoices-api.ts`

**GST Calculation** (Australian Tax):
```typescript
// All prices in Australia include GST
// GST is 10% of the total, calculated as: total ÷ 11

const subtotal = 1000;  // Base price
const gst = subtotal / 11;  // = 90.91
const total = subtotal + gst;  // = 1090.91

// Or if you have GST-inclusive price:
const totalIncGST = 1100;
const gst = totalIncGST / 11;  // = 100
const subtotal = totalIncGST - gst;  // = 1000
```

**Invoice Generation**:
```typescript
// server/services/invoiceService.ts
export class InvoiceService {
  async createInvoice(userId: string, data: CreateInvoiceData) {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) =>
      sum + (item.quantity * item.unitPrice), 0
    );

    const gst = subtotal / 11;  // Australian GST formula
    const total = subtotal + gst;

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await this.getInvoiceCountForYear(userId, year);
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, '0')}`;

    // Create invoice
    const [invoice] = await db.insert(invoices).values({
      userId,
      invoiceNumber,
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: total.toFixed(2),
      items: JSON.stringify(data.items),
      status: 'draft',
      issueDate: new Date(),
      dueDate: this.calculateDueDate(data.paymentTerms || 14)
    }).returning();

    return invoice;
  }

  async sendInvoice(invoiceId: number, userId: string) {
    const invoice = await this.getInvoice(invoiceId, userId);
    const customer = await customerService.getCustomer(invoice.customerId);

    // Update status
    await db.update(invoices)
      .set({ status: 'sent' })
      .where(eq(invoices.id, invoiceId));

    // Send email
    await emailService.sendInvoice(customer.email, invoice);

    // Trigger automation
    await automationEngine.processTrigger('invoice_sent', { userId, invoice });

    return invoice;
  }

  async processPayment(invoiceId: number, paymentData: PaymentData) {
    // Process Stripe payment
    const paymentIntent = await stripe.paymentIntents.confirm(
      paymentData.paymentIntentId
    );

    if (paymentIntent.status === 'succeeded') {
      // Mark invoice as paid
      await db.update(invoices).set({
        status: 'paid',
        amountPaid: invoice.total,
        paymentMethod: 'stripe',
        paidAt: new Date()
      }).where(eq(invoices.id, invoiceId));

      // Trigger automation (review request, thank you email)
      await automationEngine.processTrigger('invoice_paid', { invoice });
    }
  }
}
```

**Invoice Email Template**:
```html
<!-- Sent via SendGrid -->
<h1>Invoice ${invoiceNumber}</h1>
<p>Amount Due: $${total} AUD (inc. GST)</p>
<p>Due Date: ${dueDate}</p>

<table>
  <tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
  ${items.map(item => `
    <tr>
      <td>${item.description}</td>
      <td>${item.quantity}</td>
      <td>$${item.unitPrice}</td>
      <td>$${item.total}</td>
    </tr>
  `).join('')}
  <tr><td colspan="3">Subtotal</td><td>$${subtotal}</td></tr>
  <tr><td colspan="3">GST (10%)</td><td>$${gst}</td></tr>
  <tr><td colspan="3"><strong>Total</strong></td><td><strong>$${total}</strong></td></tr>
</table>

<a href="${paymentLink}">Pay Now</a>
```

### 4. Automation Engine

**Location**: `server/services/automationEngine.ts`, `server/workers/automationWorker.ts`

**Architecture**:
```
Event Occurs → automationEngine.processTrigger()
  → Find matching rules
  → Add job to Bull queue (with delay)
  → [Queue persisted in Redis]
  → Worker picks up job
  → Execute action (send email/SMS)
  → Log result in automation_executions
```

**Why Bull Queue?**
- **Persistence**: Jobs survive server restarts
- **Retries**: Automatic retry with exponential backoff
- **Delay**: Schedule jobs for future execution
- **Monitoring**: Track job status and failures
- **Scalability**: Can run multiple workers

**Implementation**:
```typescript
// server/services/automationEngine.ts
export class AutomationEngine {
  // Called when events occur (job completed, invoice paid, etc.)
  async processTrigger(triggerType: string, context: TriggerContext) {
    // Find active rules matching this trigger
    const rules = await db
      .select()
      .from(automationRules)
      .where(and(
        eq(automationRules.userId, context.userId),
        eq(automationRules.triggerType, triggerType),
        eq(automationRules.isActive, true)
      ));

    for (const rule of rules) {
      // Check if conditions match
      if (this.matchesConditions(rule.triggerConditions, context)) {
        // Schedule execution (possibly with delay)
        await this.scheduleExecution(rule, context);
      }
    }
  }

  // Schedule job in Bull queue
  private async scheduleExecution(rule: AutomationRule, context: TriggerContext) {
    const delayMs = (rule.actionConfig.delayHours || 0) * 60 * 60 * 1000;

    // Add to Bull queue
    await automationQueue.add(
      {
        ruleId: rule.id,
        context
      },
      {
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      }
    );
  }

  // Execute automation action
  async executeRule(rule: AutomationRule, context: TriggerContext) {
    const execution = await this.logExecution(rule.id, context);

    try {
      switch (rule.actionType) {
        case 'send_email':
          await this.sendEmail(rule.actionConfig, context);
          break;
        case 'send_sms':
          await this.sendSMS(rule.actionConfig, context);
          break;
        case 'request_review':
          await this.requestReview(rule.actionConfig, context);
          break;
      }

      // Mark success
      await db.update(automationExecutions)
        .set({ status: 'success', executedAt: new Date() })
        .where(eq(automationExecutions.id, execution.id));

    } catch (error) {
      // Mark failed
      await db.update(automationExecutions)
        .set({
          status: 'failed',
          errorMessage: error.message
        })
        .where(eq(automationExecutions.id, execution.id));

      throw error;  // Let Bull retry
    }
  }

  private async requestReview(config: any, context: TriggerContext) {
    // Generate unique tracking token
    const token = crypto.randomBytes(32).toString('hex');

    // Create review request record
    await db.insert(reviewRequests).values({
      userId: context.userId,
      customerId: context.customerId,
      jobId: context.jobId,
      platform: config.platform,  // 'google', 'facebook'
      token,
      requestedAt: new Date()
    });

    // Send email with review link
    const reviewUrl = `${process.env.APP_URL}/api/automation/reviews/${token}/click`;

    await emailService.send({
      to: context.customerEmail,
      template: 'review_request',
      data: {
        customerName: context.customerName,
        businessName: context.businessName,
        reviewUrl
      }
    });
  }
}

// server/workers/automationWorker.ts
// This file runs as a separate process
automationQueue.process(async (job) => {
  const { ruleId, context } = job.data;

  // Get rule
  const [rule] = await db
    .select()
    .from(automationRules)
    .where(eq(automationRules.id, ruleId))
    .limit(1);

  if (!rule?.isActive) {
    return { skipped: true };
  }

  // Execute rule
  await automationEngine.executeRule(rule, context);

  return { success: true };
});
```

**Queue Configuration**:
```typescript
// server/services/queueService.ts
import Bull from 'bull';
import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
};

export const automationQueue = new Bull('automation', {
  createClient: (type) => new Redis(redisConfig),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000  // 2s, 4s, 8s
    },
    removeOnComplete: 100,  // Keep last 100
    removeOnFail: 500       // Keep last 500 failures
  }
});
```

**Example Automation Rules**:

1. **Follow-up Email After Job Completion**:
```json
{
  "name": "2-day follow-up",
  "triggerType": "job_completed",
  "actionType": "send_email",
  "actionConfig": {
    "template": "follow_up",
    "delayHours": 48,
    "subject": "How did we do?"
  }
}
```

2. **Review Request After Payment**:
```json
{
  "name": "Google review request",
  "triggerType": "invoice_paid",
  "actionType": "request_review",
  "actionConfig": {
    "platform": "google",
    "delayHours": 24
  }
}
```

3. **Overdue Invoice Reminder**:
```json
{
  "name": "Payment reminder",
  "triggerType": "invoice_overdue",
  "actionType": "send_email",
  "actionConfig": {
    "template": "payment_reminder",
    "delayHours": 0
  }
}
```

### 5. Australian Tax Compliance (BAS/GST)

**Location**: `server/services/accountingService.ts`

**BAS (Business Activity Statement)**:
- Required quarterly reporting to ATO
- Reports GST collected and paid
- Due dates: 28th of month after quarter end

**Quarters**:
```
Q1: July 1 - Sept 30 (Financial Year start)
Q2: Oct 1 - Dec 31
Q3: Jan 1 - Mar 31
Q4: Apr 1 - June 30 (Financial Year end)
```

**BAS Calculation Logic**:
```typescript
// server/services/accountingService.ts
export class AccountingService {
  async generateBasReport(userId: string, quarter: string) {
    const period = this.getBasPeriod(quarter);  // Get start/end dates

    // Calculate sales (from invoices)
    const sales = await db
      .select({
        total: sql`SUM(subtotal)`,
        gst: sql`SUM(gst)`
      })
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        gte(invoices.issueDate, period.start),
        lte(invoices.issueDate, period.end),
        inArray(invoices.status, ['sent', 'paid'])
      ));

    // Calculate purchases (from expenses)
    const purchases = await db
      .select({
        total: sql`SUM(amount)`,
        gst: sql`SUM(gst)`
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        gte(expenses.expenseDate, period.start),
        lte(expenses.expenseDate, period.end)
      ));

    // Net GST owed to ATO
    const netGst = sales.gst - purchases.gst;

    // Create BAS report
    const [report] = await db.insert(basReports).values({
      userId,
      quarter,
      startDate: period.start,
      endDate: period.end,
      status: 'draft',
      totalSales: sales.total,
      gstOnSales: sales.gst,
      totalPurchases: purchases.total,
      gstOnPurchases: purchases.gst,
      netGst
    }).returning();

    return report;
  }

  // AI-powered tax deduction suggestions
  async generateTaxSuggestions(userId: string) {
    // Get recent expenses without deduction suggestions
    const expenses = await db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        eq(expenses.isDeductible, false)
      ))
      .limit(20);

    const suggestions = [];

    for (const expense of expenses) {
      // Ask Claude AI to analyze expense
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analyze this business expense for an Australian tradie:

            Amount: $${expense.amount}
            Description: ${expense.description}
            Vendor: ${expense.vendor}

            Determine:
            1. Is it tax deductible?
            2. What percentage is deductible?
            3. Which ATO category?
            4. Provide reasoning with ATO ruling reference

            Respond in JSON format.`
        }]
      });

      const analysis = JSON.parse(response.content[0].text);

      if (analysis.isDeductible) {
        // Find matching tax category
        const [category] = await db
          .select()
          .from(taxCategories)
          .where(eq(taxCategories.category, analysis.category))
          .limit(1);

        // Create suggestion
        await db.insert(taxDeductions).values({
          userId,
          expenseId: expense.id,
          categoryId: category.id,
          suggestedAmount: (expense.amount * analysis.deductionRate / 100).toFixed(2),
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          atoReference: analysis.atoReference,
          status: 'pending'
        });

        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }
}
```

**Tax Category Examples**:
```typescript
// Seeded in database (server/db/seed.ts)
const taxCategories = [
  {
    name: 'Vehicle Expenses',
    category: 'vehicle',
    deductible: true,
    deductionRate: '100.00',  // Fully deductible
    atoCategory: 'D1',
    requiresReceipt: true
  },
  {
    name: 'Phone & Internet',
    category: 'communications',
    deductible: true,
    deductionRate: '50.00',  // 50% business use
    atoCategory: 'D8',
    requiresReceipt: false
  },
  {
    name: 'Home Office',
    category: 'office',
    deductible: true,
    deductionRate: '20.00',  // 20% of home = office
    atoCategory: 'D5',
    requiresReceipt: false
  }
];
```

### 6. PWA (Progressive Web App) Implementation

**Location**: `client/public/sw.js`, `client/src/utils/pwa.ts`

**Service Worker Strategy**:
```javascript
// client/public/sw.js
const CACHE_NAME = 'blue-tradie-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Fetch event - network first for API, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // API requests - network first, fall back to offline
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(
            JSON.stringify({ offline: true, message: 'No internet connection' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
  }

  // Static assets - cache first, fall back to network
  else {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          // Cache new assets
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        }).catch(() => {
          // Offline fallback
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
    );
  }
});
```

**Manifest Configuration**:
```json
// client/public/manifest.json
{
  "name": "Blue Tradie",
  "short_name": "Blue Tradie",
  "description": "Business management for Australian tradies",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "New Invoice",
      "url": "/invoices/new",
      "icons": [{ "src": "/icon-invoice.png", "sizes": "96x96" }]
    },
    {
      "name": "New Quote",
      "url": "/quotes/new",
      "icons": [{ "src": "/icon-quote.png", "sizes": "96x96" }]
    },
    {
      "name": "AI Chat",
      "url": "/ai-advisors",
      "icons": [{ "src": "/icon-chat.png", "sizes": "96x96" }]
    }
  ]
}
```

**PWA Registration**:
```typescript
// client/src/utils/pwa.ts
export function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                if (confirm('New version available! Reload to update?')) {
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    });
  }

  // Handle offline/online events
  window.addEventListener('online', () => {
    console.log('Back online - syncing data...');
    syncOfflineData();
  });

  window.addEventListener('offline', () => {
    console.log('Offline mode - changes will sync when online');
  });
}

async function syncOfflineData() {
  // Sync any queued mutations
  const queue = await getOfflineQueue();

  for (const mutation of queue) {
    try {
      await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers,
        body: mutation.body
      });

      await removeFromQueue(mutation.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

### 7. Voice Input Feature

**Location**: `client/src/pages/voice-quote.tsx`, `client/src/hooks/useVoiceInput.ts`

**Web Speech API Integration**:
```typescript
// client/src/hooks/useVoiceInput.ts
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;  // Keep listening
    recognition.interimResults = true;  // Get partial results
    recognition.lang = 'en-AU';  // Australian English

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + ' ';
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    recognitionRef.current?.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return { isListening, transcript, startListening, stopListening };
}
```

**Voice Quote Entry**:
```typescript
// client/src/pages/voice-quote.tsx
export default function VoiceQuote() {
  const { isListening, transcript, startListening, stopListening } = useVoiceInput();
  const [quote, setQuote] = useState<QuoteData>({});

  // Parse transcript into quote fields
  useEffect(() => {
    if (!transcript) return;

    // Simple NLP parsing
    const parsed = parseVoiceInput(transcript);
    setQuote(parsed);
  }, [transcript]);

  return (
    <div>
      <h1>Voice Quote Entry</h1>

      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? 'Stop' : 'Start'} Recording
      </button>

      <div className="transcript">
        {transcript}
      </div>

      <div className="quote-preview">
        <h2>Quote Details</h2>
        <p>Customer: {quote.customerName}</p>
        <p>Description: {quote.description}</p>
        <p>Amount: ${quote.amount}</p>
      </div>
    </div>
  );
}

function parseVoiceInput(transcript: string): QuoteData {
  // Extract information using regex patterns

  // Customer name: "quote for John Smith"
  const customerMatch = transcript.match(/(?:quote for|customer|client)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);

  // Amount: "five thousand dollars" or "$5000"
  const amountMatch = transcript.match(/\$?([\d,]+)\s*(?:dollars?)?/);

  // Description: everything else
  const description = transcript.replace(customerMatch?.[0] || '', '').trim();

  return {
    customerName: customerMatch?.[1],
    amount: amountMatch?.[1]?.replace(/,/g, ''),
    description
  };
}
```

### 8. File Upload Security

**Location**: `server/middleware/file-security.ts`

**Multi-Layer Security**:

1. **MIME Type Validation** (multer)
2. **Magic Number Validation** (file content)
3. **Filename Sanitization** (path traversal prevention)
4. **Size Limits**
5. **Rate Limiting**

**Implementation**:
```typescript
// server/middleware/file-security.ts

// File signatures (magic numbers) for validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],  // %PDF
  // ... more types
};

// Validate file content matches MIME type
export function validateFileContent(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType];

  if (!signatures) return true;  // Unknown type, skip

  return signatures.some(signature => {
    if (buffer.length < signature.length) return false;

    return signature.every((byte, index) => buffer[index] === byte);
  });
}

// Sanitize filename to prevent path traversal
export function sanitizeFilename(filename: string): string {
  const basename = path.basename(filename);  // Remove path

  const sanitized = basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')  // Remove unsafe chars
    .replace(/\.{2,}/g, '.')           // No multiple dots
    .replace(/^\./, '')                // No leading dot
    .substring(0, 255);                // Limit length

  if (!sanitized || sanitized === '.') {
    return `file_${Date.now()}`;
  }

  return sanitized;
}

// Comprehensive file validation
export function validateUploadedFile(file: Express.Multer.File): FileValidationResult {
  // 1. Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.originalname);

  // 2. Check size
  const { maxSizeBytes } = getFileSizeLimits();
  if (file.size > maxSizeBytes) {
    return { valid: false, error: 'File too large' };
  }

  // 3. Check MIME type allowed
  const allowedMimes = getAllowedMimeTypes();
  if (!allowedMimes.includes(file.mimetype)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // 4. Validate extension matches MIME
  if (!validateExtension(sanitizedFilename, file.mimetype)) {
    return { valid: false, error: 'Extension mismatch' };
  }

  // 5. Validate magic numbers
  if (!validateFileContent(file.buffer, file.mimetype)) {
    return { valid: false, error: 'Content mismatch (possible spoofing)' };
  }

  return { valid: true, sanitizedFilename };
}
```

**Usage in Route**:
```typescript
// server/routes/documents-api.ts
documentsApiRouter.post(
  '/api/documents/upload',
  uploadRateLimit,  // Rate limiting: 20 uploads per 15 minutes
  upload.single('file'),  // Multer middleware
  async (req: any, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Enhanced security validation
    const validation = validateUploadedFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    // Upload to S3
    const document = await documentService.uploadToS3(
      req.user.id,
      {
        originalName: validation.sanitizedFilename,
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    );

    res.json(document);
  }
);
```

**Virus Scanning (Ready for Integration)**:
```typescript
// server/middleware/file-security.ts
// TODO: Integrate ClamAV or cloud scanning service

/*
Example with ClamAV:

import NodeClam from 'clamscan';

const clam = await new NodeClam().init({
  clamdscan: {
    host: 'localhost',
    port: 3310
  }
});

export async function scanFile(buffer: Buffer): Promise<ScanResult> {
  const { isInfected, viruses } = await clam.scanBuffer(buffer);

  if (isInfected) {
    throw new Error(`Virus detected: ${viruses.join(', ')}`);
  }

  return { clean: true };
}
*/
```

---

## API Architecture

### Request/Response Flow

```
Client Request
  │
  ├─> Express Router (routes/xxx-api.ts)
  │     │
  │     ├─> Authentication Middleware (middleware/auth.ts)
  │     │     - Checks session cookie
  │     │     - Adds req.user
  │     │
  │     ├─> Rate Limiting Middleware (middleware/ai-rate-limit.ts)
  │     │     - Checks request count per user
  │     │
  │     ├─> Validation (Zod schemas)
  │     │     - Parse and validate req.body
  │     │
  │     └─> Service Layer (services/xxxService.ts)
  │           │
  │           ├─> Database Operations (Drizzle ORM)
  │           │
  │           ├─> External APIs (OpenAI, Stripe, SendGrid)
  │           │
  │           └─> Background Jobs (Bull queue)
  │
  └─> Response (JSON)
```

### Error Handling

**Centralized Error Handler**:
```typescript
// server/index.ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log to Sentry
  Sentry.captureException(err);

  // Zod validation errors
  if (err instanceof z.ZodError) {
    return res.status(422).json({
      error: 'Validation error',
      message: 'Invalid input data',
      errors: err.errors
    });
  }

  // Rate limit errors
  if (err.message.includes('Rate limit')) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: err.message
    });
  }

  // Generic errors
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});
```

### Validation with Zod

**Schema Definition**:
```typescript
// shared/schema.ts
export const insertJobSchema = z.object({
  customerId: z.number(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  jobType: z.enum(['installation', 'repair', 'maintenance', 'renovation']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  estimatedCost: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  address: z.string().optional(),
  suburb: z.string().optional(),
  postcode: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export type InsertJob = z.infer<typeof insertJobSchema>;
```

**Usage in Routes**:
```typescript
// server/routes/jobs-api.ts
app.post('/api/jobs', async (req: any, res: Response) => {
  try {
    // Validate input
    const validatedData = insertJobSchema.parse(req.body);

    // Create job
    const job = await jobService.createJob(req.user.id, validatedData);

    res.status(201).json(job);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({
        error: 'Validation error',
        errors: error.errors
      });
    }
    throw error;
  }
});
```

---

## Frontend Architecture

### State Management with TanStack Query

**Why TanStack Query?**
- Automatic caching and invalidation
- Background refetching
- Optimistic updates
- Loading/error states handled
- DevTools for debugging

**Configuration**:
```typescript
// client/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      cacheTime: 1000 * 60 * 30,  // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1
    },
    mutations: {
      retry: 0
    }
  }
});
```

**Custom Hooks Pattern**:
```typescript
// client/src/hooks/useJobs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useJobs(status?: string) {
  return useQuery({
    queryKey: ['jobs', status],
    queryFn: async () => {
      const url = status ? `/api/jobs?status=${status}` : '/api/jobs';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    }
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertJob) => {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create job');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate jobs query to refetch
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
  });
}

export function useCompleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, data }: { jobId: number; data: CompleteJobData }) => {
      const res = await fetch(`/api/jobs/${jobId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to complete job');
      return res.json();
    },
    onMutate: async ({ jobId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['jobs'] });

      const previousJobs = queryClient.getQueryData(['jobs']);

      queryClient.setQueryData(['jobs'], (old: any[]) =>
        old.map(job =>
          job.id === jobId
            ? { ...job, status: 'completed' }
            : job
        )
      );

      return { previousJobs };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
  });
}
```

**Usage in Components**:
```typescript
// client/src/pages/jobs.tsx
export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data: jobs, isLoading, error } = useJobs(statusFilter);
  const createJob = useCreateJob();
  const completeJob = useCompleteJob();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <h1>Jobs</h1>

      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      <button onClick={() => createJob.mutate({ title: 'New Job', ... })}>
        Create Job
      </button>

      <div className="jobs-list">
        {jobs?.map(job => (
          <JobCard
            key={job.id}
            job={job}
            onComplete={() => completeJob.mutate({ jobId: job.id, data: { ... } })}
          />
        ))}
      </div>
    </div>
  );
}
```

### Component Structure

**Atomic Design Pattern**:
```
components/
├── ui/                    # Atoms (shadcn/ui primitives)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
│
├── [feature]/            # Molecules (feature-specific)
│   ├── JobCard.tsx
│   ├── InvoiceItem.tsx
│   └── CustomerForm.tsx
│
└── [layout]/             # Organisms (complex components)
    ├── Dashboard.tsx
    ├── Sidebar.tsx
    └── Header.tsx
```

**Example Component**:
```typescript
// client/src/components/JobCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface JobCardProps {
  job: Job;
  onComplete: () => void;
  onEdit: () => void;
}

export function JobCard({ job, onComplete, onEdit }: JobCardProps) {
  const statusColors = {
    pending: 'gray',
    'in-progress': 'blue',
    completed: 'green',
    cancelled: 'red'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{job.title}</CardTitle>
          <Badge variant={statusColors[job.status]}>
            {job.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-gray-600">{job.description}</p>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Customer:</span>
            <span className="font-medium">{job.customerName}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Due Date:</span>
            <span>{formatDate(job.dueDate)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Estimated:</span>
            <span>${job.estimatedCost}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {job.status === 'in-progress' && (
            <Button onClick={onComplete} className="flex-1">
              Mark Complete
            </Button>
          )}

          <Button onClick={onEdit} variant="outline" className="flex-1">
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Security Implementation

### 1. Authentication Security

- **Magic Links** - No password storage, reduces attack surface
- **HTTP-Only Cookies** - Session tokens not accessible to JavaScript
- **SameSite Cookies** - CSRF protection
- **Token Expiry** - Magic links expire after 15 minutes
- **Session Expiry** - Sessions expire after 30 days of inactivity

### 2. API Security

**Rate Limiting**:
```typescript
// server/middleware/ai-rate-limit.ts
export const aiChatRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 50,  // 50 requests per hour
  keyGenerator: (req: any) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many AI requests. Try again in an hour.'
    });
  }
});
```

**CORS Configuration**:
```typescript
// server/index.ts
app.use(cors({
  origin: process.env.APP_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE']
}));
```

**Security Headers**:
```typescript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### 3. SQL Injection Protection

**Drizzle ORM Parameterized Queries**:
```typescript
// ✅ SAFE - Parameterized
const job = await db
  .select()
  .from(jobs)
  .where(eq(jobs.id, jobId));  // Auto-parameterized

// ❌ UNSAFE - Raw SQL injection risk
const job = await db.execute(sql`SELECT * FROM jobs WHERE id = ${jobId}`);
```

### 4. XSS Protection

**React Auto-Escaping**:
```tsx
// ✅ SAFE - React auto-escapes
<p>{job.description}</p>

// ❌ UNSAFE - dangerouslySetInnerHTML
<p dangerouslySetInnerHTML={{ __html: job.description }} />

// ✅ SAFE - Sanitize if HTML needed
import DOMPurify from 'dompurify';
<p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description) }} />
```

### 5. File Upload Security

See detailed implementation in [Feature #8](#8-file-upload-security)

---

## Background Jobs & Queue System

### Bull Queue Architecture

**Why Bull over setTimeout/setInterval?**

| Feature | setTimeout | Bull Queue |
|---------|-----------|------------|
| Persistence | ❌ Lost on restart | ✅ Survives restarts |
| Retries | ❌ Manual | ✅ Automatic with backoff |
| Monitoring | ❌ None | ✅ Built-in dashboard |
| Scalability | ❌ Single server | ✅ Multi-worker |
| Delay | ✅ Yes | ✅ Yes |
| Job History | ❌ None | ✅ Complete logs |

**Queue Configuration**:
```typescript
// server/services/queueService.ts
import Bull from 'bull';

export const automationQueue = new Bull('automation', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000  // 2s, 4s, 8s
    },
    removeOnComplete: 100,
    removeOnFail: 500
  }
});

export const emailQueue = new Bull('email', { ... });
```

**Adding Jobs**:
```typescript
// server/services/automationEngine.ts
await automationQueue.add(
  {
    ruleId: 123,
    context: { userId, jobId, customerEmail }
  },
  {
    delay: 48 * 60 * 60 * 1000,  // 48 hours
    priority: 1,  // Higher priority = processed first
    jobId: `automation-${ruleId}-${Date.now()}`
  }
);
```

**Processing Jobs**:
```typescript
// server/workers/automationWorker.ts
automationQueue.process(async (job) => {
  const { ruleId, context } = job.data;

  // Update progress
  job.progress(10);

  // Get rule from database
  const rule = await getRule(ruleId);

  job.progress(50);

  // Execute action
  await executeAction(rule, context);

  job.progress(100);

  return { success: true, executedAt: new Date() };
});

// Error handling
automationQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
  Sentry.captureException(error, {
    tags: { jobId: job.id, queue: 'automation' }
  });
});
```

**Monitoring**:
```typescript
// Get queue statistics
const jobCounts = await automationQueue.getJobCounts();
// { waiting: 10, active: 2, completed: 150, failed: 3 }

// Get specific job
const job = await automationQueue.getJob(jobId);
console.log(job.progress());  // 75
console.log(job.getState());  // 'active'

// Retry failed job
await job.retry();
```

---

## AI Integration

### OpenAI (Chat Assistant)

**Location**: `server/services/aiService.ts`, `server/routes/ai-api.ts`

**Purpose**: Business intelligence chatbot for querying data

**Implementation**:
```typescript
// server/services/aiService.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function chatWithAI(userId: string, message: string, conversationId?: string) {
  // Get user context (recent jobs, invoices, etc.)
  const context = await getUserContext(userId);

  // Build system prompt
  const systemPrompt = `You are an AI assistant for Blue Tradie, a business management platform for Australian tradies.

Current user context:
- Total jobs this month: ${context.jobsThisMonth}
- Outstanding invoices: ${context.outstandingInvoices}
- Total revenue this quarter: $${context.revenueThisQuarter}

Answer questions about their business, provide insights, and help them take action.`;

  // Get conversation history
  const history = conversationId
    ? await getConversationHistory(conversationId)
    : [];

  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  const assistantMessage = response.choices[0].message.content;

  // Save conversation
  await saveConversationMessage(conversationId, 'user', message);
  await saveConversationMessage(conversationId, 'assistant', assistantMessage);

  return { response: assistantMessage, conversationId };
}

async function getUserContext(userId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterStart = getQuarterStart(now);

  // Jobs this month
  const jobsThisMonth = await db
    .select({ count: sql`count(*)` })
    .from(jobs)
    .where(and(
      eq(jobs.userId, userId),
      gte(jobs.createdAt, monthStart)
    ));

  // Outstanding invoices
  const outstanding = await db
    .select({
      count: sql`count(*)`,
      total: sql`sum(total - amount_paid)`
    })
    .from(invoices)
    .where(and(
      eq(invoices.userId, userId),
      inArray(invoices.status, ['sent', 'overdue'])
    ));

  // Revenue this quarter
  const revenue = await db
    .select({ total: sql`sum(amount_paid)` })
    .from(invoices)
    .where(and(
      eq(invoices.userId, userId),
      gte(invoices.paidAt, quarterStart)
    ));

  return {
    jobsThisMonth: jobsThisMonth[0].count,
    outstandingInvoices: outstanding[0].count,
    outstandingAmount: outstanding[0].total,
    revenueThisQuarter: revenue[0].total
  };
}
```

**Example Queries**:
- "How many jobs do I have this week?"
- "What's my total revenue this month?"
- "Show me overdue invoices"
- "Create a new quote for John Smith"

### Anthropic Claude (Tax & Automation)

**Location**: `server/services/accountingService.ts`

**Purpose**:
1. Tax deduction suggestions
2. Automation email generation
3. Complex business logic

**Tax Suggestion Example**:
```typescript
// server/services/accountingService.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function analyzeTaxDeduction(expense: Expense) {
  const prompt = `You are a tax expert for Australian tradies.

Analyze this business expense and determine:
1. Is it tax deductible under ATO rules?
2. What percentage is deductible?
3. Which ATO category does it fall under?
4. Provide reasoning with ATO ruling reference

Expense Details:
- Amount: $${expense.amount}
- Description: ${expense.description}
- Vendor: ${expense.vendor}
- Date: ${expense.expenseDate}

Respond in JSON format:
{
  "isDeductible": boolean,
  "deductionRate": number (0-100),
  "category": string,
  "atoCategory": string,
  "confidence": "high" | "medium" | "low",
  "reasoning": string,
  "atoReference": string
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const analysis = JSON.parse(response.content[0].text);

  return analysis;
}
```

**Example Analysis**:
```json
{
  "isDeductible": true,
  "deductionRate": 100,
  "category": "vehicle",
  "atoCategory": "D1",
  "confidence": "high",
  "reasoning": "Fuel expenses for a work vehicle used solely for business purposes are fully deductible under section 8-1 of the Income Tax Assessment Act 1997.",
  "atoReference": "TR 2021/1"
}
```

---

## Key Files Reference

### Core Configuration

**package.json**
- Dependencies and scripts
- ESM modules (`"type": "module"`)
- Node 20.x engine requirement

**tsconfig.json**
- Strict TypeScript configuration
- Path aliases (`@/` → `client/src/`, `@db` → `server/db/`)
- ES2022 target, ESNext modules

**vite.config.ts**
- Frontend build configuration
- Proxy API requests to backend during dev
- PWA plugin configuration

### Backend Entry Points

**server/index.ts** (Main server file)
- Express app initialization
- Middleware setup (auth, CORS, sessions)
- Route registration
- Error handling
- Sentry integration
- Starts automation worker

**server/db/index.ts** (Database connection)
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client);
```

### Schema Definition

**shared/schema.ts** (Single source of truth)
- All database tables defined with Drizzle
- Zod validation schemas exported
- Type inference for TypeScript

Example:
```typescript
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status').notNull().default('pending'),
  // ...
});

export const insertJobSchema = createInsertSchema(jobs);
export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;
```

### Frontend Entry Points

**client/src/main.tsx** (App entry)
- React root rendering
- Sentry initialization
- Error boundary wrapping

**client/src/App.tsx** (Root component)
- Route definitions
- QueryClientProvider setup
- Authentication context

### Environment Configuration

**.env.example** (Template for all environment variables)
- Comprehensive documentation
- Required vs optional marked
- Example values provided

---

## Design Patterns & Conventions

### 1. Service Layer Pattern

All business logic lives in services, not routes.

```
Routes (thin) → Services (thick) → Database
```

**Benefits**:
- Testable business logic
- Reusable across routes
- Clear separation of concerns

### 2. Repository Pattern (implicit via Drizzle)

Database queries centralized in service methods.

```typescript
// ❌ BAD - Query in route
app.get('/api/jobs', async (req, res) => {
  const jobs = await db.select().from(jobs).where(eq(jobs.userId, req.user.id));
  res.json(jobs);
});

// ✅ GOOD - Query in service
app.get('/api/jobs', async (req, res) => {
  const jobs = await jobService.getJobs(req.user.id);
  res.json(jobs);
});
```

### 3. Factory Pattern for Services

Services are instantiated once and exported.

```typescript
// server/services/jobService.ts
class JobService {
  async getJobs(userId: string) { ... }
  async createJob(userId: string, data: InsertJob) { ... }
}

export const jobService = new JobService();
```

### 4. Custom Hooks Pattern (React)

All data fetching through custom hooks.

```typescript
// ❌ BAD - Fetch in component
function JobsPage() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then(setJobs);
  }, []);
}

// ✅ GOOD - Custom hook
function JobsPage() {
  const { data: jobs } = useJobs();
}
```

### 5. Dependency Injection

Services injected into routes via imports.

```typescript
// server/routes/jobs-api.ts
import { jobService } from '../services/jobService';
import { automationEngine } from '../services/automationEngine';

app.post('/api/jobs', async (req, res) => {
  const job = await jobService.createJob(req.user.id, req.body);
  await automationEngine.processTrigger('job_created', { job });
  res.json(job);
});
```

### 6. Error Boundary Pattern (React)

All routes wrapped in error boundaries.

```tsx
// client/src/main.tsx
<RootErrorBoundary>
  <App />
</RootErrorBoundary>

// client/src/pages/dashboard.tsx
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>
```

---

## Development Workflow

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your config

# 3. Setup database
npm run db:push
npm run db:seed

# 4. Generate icons
npm run icons:generate

# 5. Start dev server
npm run dev
# Opens http://localhost:5000
```

### Testing Flow

```bash
# Type checking
npm run check

# Run tests (when implemented)
npm test

# Build for production
npm run build

# Test production build
npm start
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: Add my feature"

# Push
git push origin feature/my-feature

# Create PR
gh pr create --title "Add my feature" --body "Description..."
```

### Database Migrations

```bash
# After modifying shared/schema.ts
npm run db:push

# This will:
# 1. Analyze schema changes
# 2. Generate SQL
# 3. Apply to database
```

### Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database schema pushed
- [ ] Default data seeded
- [ ] PWA icons generated
- [ ] Sentry DSN configured
- [ ] Redis connection working
- [ ] SendGrid API key valid
- [ ] Stripe webhooks configured
- [ ] SSL certificate installed

---

## Summary for AI Code Copilot

### What This Codebase Is

Blue Tradie is a **full-stack SaaS platform** for Australian tradies with:
- Complete business management (jobs, invoices, quotes, customers)
- AI-powered automation and chat assistant
- Australian tax compliance (GST, BAS reporting)
- PWA with offline capabilities
- Voice input features
- Team collaboration
- Document management with S3 storage

### Tech Stack

**Frontend**: React + TypeScript + TanStack Query + Tailwind + shadcn/ui
**Backend**: Node.js + Express + TypeScript (ESM)
**Database**: PostgreSQL + Drizzle ORM
**Queue**: Bull + Redis
**AI**: OpenAI GPT-4 + Anthropic Claude
**Infrastructure**: AWS S3, SendGrid, Stripe, Sentry

### Key Architecture Decisions

1. **Service Layer**: All business logic in services, routes are thin
2. **TanStack Query**: Server state management, no Redux
3. **Drizzle ORM**: Type-safe SQL, lighter than Prisma
4. **Bull Queue**: Production-ready job processing with persistence
5. **Magic Link Auth**: No passwords, better security
6. **PWA**: Offline-first with service workers
7. **Multi-layer Security**: Magic numbers, rate limiting, sanitization

### Areas for Improvement

1. **Testing**: No tests yet (unit, integration, E2E needed)
2. **Error Handling**: Could be more granular
3. **Type Safety**: Some `any` types remain
4. **Performance**: Database query optimization needed at scale
5. **Documentation**: API docs complete, but internal code comments sparse
6. **Monitoring**: Sentry integrated, but more metrics needed

### Common Patterns

- Custom hooks for all data fetching (`useJobs`, `useInvoices`)
- Service methods follow CRUD convention (`get`, `create`, `update`, `delete`)
- All mutations invalidate related queries
- Background jobs for delayed actions
- AI suggestions follow: analyze → suggest → user accepts/dismisses
- File uploads: validate → sanitize → upload S3 → log access

### When Making Changes

- **Database**: Modify `shared/schema.ts`, run `npm run db:push`
- **API**: Add route in `server/routes/`, add service in `server/services/`
- **Frontend**: Add page in `client/src/pages/`, create custom hook in `client/src/hooks/`
- **Background Jobs**: Use Bull queue, don't use setTimeout
- **Validation**: Use Zod schemas from `shared/schema.ts`
- **AI Features**: Rate limit with `aiRateLimit` middleware

---

**This document should provide everything needed to understand, modify, and extend the Blue Tradie platform. Ask questions about any section for deeper technical details.**
