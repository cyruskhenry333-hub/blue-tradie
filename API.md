# Blue Tradie API Documentation

Complete REST API reference for Blue Tradie platform.

## Base URL

```
Production: https://api.bluetradie.com
Development: http://localhost:5000
```

## Authentication

All API endpoints require authentication unless marked as `[PUBLIC]`.

### Session-Based Authentication

Blue Tradie uses session-based authentication with HTTP-only cookies.

#### Login via Magic Link

```http
POST /api/auth/magic-link
Content-Type: application/json

{
  "email": "tradie@example.com"
}
```

**Response**:
```json
{
  "message": "Magic link sent to your email"
}
```

The user will receive an email with a login link. Clicking the link establishes a session.

#### Check Authentication Status

```http
GET /api/auth/session
```

**Response (Authenticated)**:
```json
{
  "isAuthenticated": true,
  "user": {
    "id": "user_123",
    "email": "tradie@example.com",
    "businessName": "Bob's Plumbing",
    "isOnboarded": true
  }
}
```

#### Logout

```http
POST /api/auth/logout
```

## Rate Limiting

All endpoints are rate-limited per user:

| Endpoint Type | Limit |
|--------------|-------|
| AI Chat | 50 requests/hour |
| AI Suggestions | 20 requests/hour |
| Automation | 100 executions/day |
| File Uploads | 20 uploads/15 minutes |
| General API | 1000 requests/15 minutes |

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

## Jobs API

### List Jobs

```http
GET /api/jobs
GET /api/jobs?status=in-progress
GET /api/jobs?customerId=123
```

**Query Parameters**:
- `status` (optional): Filter by status (`pending`, `in-progress`, `completed`, `cancelled`)
- `customerId` (optional): Filter by customer

**Response**:
```json
[
  {
    "id": 1,
    "userId": "user_123",
    "customerId": 456,
    "title": "Kitchen Renovation",
    "description": "Complete kitchen remodel",
    "status": "in-progress",
    "jobType": "renovation",
    "priority": "high",
    "startDate": "2025-01-15T00:00:00.000Z",
    "dueDate": "2025-02-28T00:00:00.000Z",
    "estimatedHours": "120.00",
    "actualHours": "45.00",
    "estimatedCost": "15000.00",
    "actualCost": "6000.00",
    "address": "123 Main St",
    "suburb": "Sydney",
    "postcode": "2000",
    "state": "NSW",
    "notes": "Customer wants granite countertops",
    "tags": ["renovation", "kitchen"],
    "createdAt": "2025-01-10T08:00:00.000Z",
    "updatedAt": "2025-01-20T14:30:00.000Z"
  }
]
```

### Create Job

```http
POST /api/jobs
Content-Type: application/json

{
  "customerId": 456,
  "title": "Bathroom Repair",
  "description": "Fix leaking shower",
  "jobType": "repair",
  "priority": "high",
  "startDate": "2025-01-25",
  "dueDate": "2025-01-26",
  "estimatedHours": "4",
  "estimatedCost": "500",
  "address": "456 Oak Ave",
  "suburb": "Melbourne",
  "postcode": "3000",
  "state": "VIC"
}
```

**Response**: `201 Created`
```json
{
  "id": 2,
  "userId": "user_123",
  ...
}
```

### Get Job

```http
GET /api/jobs/:id
```

**Response**: Same as job object above

### Update Job

```http
PATCH /api/jobs/:id
Content-Type: application/json

{
  "status": "completed",
  "actualHours": "5",
  "actualCost": "550"
}
```

**Response**: `200 OK` with updated job object

### Delete Job

```http
DELETE /api/jobs/:id
```

**Response**: `204 No Content`

## Invoices API

### List Invoices

```http
GET /api/invoices
GET /api/invoices?status=paid
GET /api/invoices?customerId=123
```

**Query Parameters**:
- `status` (optional): `draft`, `sent`, `paid`, `overdue`, `cancelled`
- `customerId` (optional): Filter by customer

**Response**:
```json
[
  {
    "id": 1,
    "userId": "user_123",
    "customerId": 456,
    "jobId": 1,
    "invoiceNumber": "INV-2025-001",
    "status": "sent",
    "issueDate": "2025-01-20T00:00:00.000Z",
    "dueDate": "2025-02-04T00:00:00.000Z",
    "subtotal": "5000.00",
    "gst": "500.00",
    "total": "5500.00",
    "amountPaid": "0.00",
    "paymentMethod": null,
    "paidAt": null,
    "notes": "Payment due within 14 days",
    "items": [
      {
        "description": "Labour (40 hours)",
        "quantity": "40.00",
        "unitPrice": "100.00",
        "total": "4000.00"
      },
      {
        "description": "Materials",
        "quantity": "1.00",
        "unitPrice": "1000.00",
        "total": "1000.00"
      }
    ]
  }
]
```

### Create Invoice

```http
POST /api/invoices
Content-Type: application/json

{
  "customerId": 456,
  "jobId": 1,
  "issueDate": "2025-01-20",
  "dueDate": "2025-02-04",
  "items": [
    {
      "description": "Labour (40 hours)",
      "quantity": 40,
      "unitPrice": 100
    },
    {
      "description": "Materials",
      "quantity": 1,
      "unitPrice": 1000
    }
  ],
  "notes": "Payment due within 14 days"
}
```

**Response**: `201 Created` with invoice object

### Send Invoice

```http
POST /api/invoices/:id/send
```

**Response**:
```json
{
  "message": "Invoice sent successfully",
  "sentAt": "2025-01-20T10:30:00.000Z"
}
```

### Process Payment

```http
POST /api/invoices/:id/pay
Content-Type: application/json

{
  "paymentMethod": "stripe",
  "paymentIntentId": "pi_xxxxx"
}
```

**Response**:
```json
{
  "message": "Payment processed successfully",
  "invoice": { ... }
}
```

## Quotes API

### List Quotes

```http
GET /api/quotes
GET /api/quotes?status=pending
```

**Response**: Similar structure to invoices

### Create Quote

```http
POST /api/quotes
Content-Type: application/json

{
  "customerId": 456,
  "title": "Kitchen Renovation Quote",
  "validUntil": "2025-02-15",
  "items": [
    {
      "description": "Kitchen cabinets",
      "quantity": 1,
      "unitPrice": 8000
    }
  ]
}
```

### Convert Quote to Job

```http
POST /api/quotes/:id/accept
```

**Response**:
```json
{
  "quote": { ... },
  "job": { ... }
}
```

## Customers API

### List Customers

```http
GET /api/customers
GET /api/customers?search=John
```

**Response**:
```json
[
  {
    "id": 456,
    "userId": "user_123",
    "businessName": null,
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "+61412345678",
    "address": "123 Main St",
    "suburb": "Sydney",
    "postcode": "2000",
    "state": "NSW",
    "tags": ["vip"],
    "notes": "Preferred customer",
    "createdAt": "2024-12-01T00:00:00.000Z"
  }
]
```

### Create Customer

```http
POST /api/customers
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "+61412345679",
  "address": "456 Oak Ave",
  "suburb": "Melbourne",
  "postcode": "3000",
  "state": "VIC"
}
```

## Calendar API

### List Events

```http
GET /api/calendar/events
GET /api/calendar/events?start=2025-01-01&end=2025-01-31
```

**Response**:
```json
[
  {
    "id": 1,
    "userId": "user_123",
    "title": "Kitchen Renovation - Day 1",
    "description": "Start kitchen demo",
    "startTime": "2025-01-15T09:00:00.000Z",
    "endTime": "2025-01-15T17:00:00.000Z",
    "jobId": 1,
    "eventType": "job",
    "location": "123 Main St, Sydney",
    "allDay": false,
    "color": "#4F46E5"
  }
]
```

### Create Event

```http
POST /api/calendar/events
Content-Type: application/json

{
  "title": "Site Visit",
  "startTime": "2025-01-25T10:00:00.000Z",
  "endTime": "2025-01-25T11:00:00.000Z",
  "jobId": 2,
  "eventType": "meeting",
  "location": "456 Oak Ave, Melbourne"
}
```

## Documents API

### Upload Document

```http
POST /api/documents/upload
Content-Type: multipart/form-data

file: (binary)
documentType: "receipt"
jobId: 1
title: "Materials Receipt"
category: "expense"
```

**Response**:
```json
{
  "id": 1,
  "userId": "user_123",
  "documentType": "receipt",
  "jobId": 1,
  "title": "Materials Receipt",
  "originalFileName": "receipt.pdf",
  "fileSize": 245678,
  "mimeType": "application/pdf",
  "storageProvider": "s3",
  "storagePath": "documents/user_123/receipt_20250120.pdf",
  "isPublic": false,
  "uploadedAt": "2025-01-20T15:00:00.000Z"
}
```

### List Documents

```http
GET /api/documents
GET /api/documents?type=receipt
```

### Download Document

```http
GET /api/documents/:id/download
```

Returns file binary with appropriate Content-Type header.

## Automation API

### List Automation Rules

```http
GET /api/automation/rules
```

**Response**:
```json
[
  {
    "id": 1,
    "userId": "user_123",
    "name": "Follow-up after job completion",
    "description": "Send follow-up email 2 days after job completion",
    "triggerType": "job_completed",
    "triggerConditions": {},
    "actionType": "send_email",
    "actionConfig": {
      "template": "follow_up",
      "delayHours": 48
    },
    "isActive": true,
    "executionCount": 15,
    "lastExecutedAt": "2025-01-18T10:00:00.000Z"
  }
]
```

### Create Automation Rule

```http
POST /api/automation/rules
Content-Type: application/json

{
  "name": "Request review after payment",
  "description": "Ask for Google review after invoice is paid",
  "triggerType": "invoice_paid",
  "actionType": "request_review",
  "actionConfig": {
    "platform": "google",
    "delayHours": 24
  }
}
```

### Test Automation Rule

```http
POST /api/automation/rules/:id/test
Content-Type: application/json

{
  "context": {
    "customerName": "Test Customer",
    "customerEmail": "test@example.com"
  }
}
```

**Response**:
```json
{
  "message": "Rule test executed successfully",
  "rule": { ... },
  "testContext": { ... }
}
```

### Get Execution History

```http
GET /api/automation/rules/:id/executions?limit=50
```

## Accounting API

### Get Tax Settings

```http
GET /api/accounting/settings
```

**Response**:
```json
{
  "id": 1,
  "userId": "user_123",
  "gstRegistered": true,
  "abn": "12345678901",
  "financialYearEnd": "30-06",
  "accountingBasis": "accrual",
  "basReportingPeriod": "quarterly",
  "gstRate": "10.00"
}
```

### Get BAS Reports

```http
GET /api/accounting/bas
```

**Response**:
```json
[
  {
    "id": 1,
    "userId": "user_123",
    "quarter": "Q2 2025",
    "startDate": "2024-10-01T00:00:00.000Z",
    "endDate": "2024-12-31T00:00:00.000Z",
    "status": "draft",
    "totalSales": "45000.00",
    "gstOnSales": "4500.00",
    "totalPurchases": "12000.00",
    "gstOnPurchases": "1200.00",
    "netGst": "3300.00",
    "submittedAt": null
  }
]
```

### Generate BAS Report

```http
POST /api/accounting/bas/generate
Content-Type: application/json

{
  "quarter": "Q2 2025"
}
```

### Get Tax Suggestions (AI)

```http
POST /api/accounting/suggestions/generate
```

**Rate Limited**: 20 requests/hour

**Response**:
```json
[
  {
    "id": 1,
    "userId": "user_123",
    "expenseId": 123,
    "category": "vehicle",
    "suggestedAmount": "500.00",
    "confidence": "high",
    "reasoning": "Fuel expenses for work vehicle are fully deductible",
    "atoReference": "TR 2021/1",
    "status": "pending"
  }
]
```

### Accept Tax Suggestion

```http
POST /api/accounting/suggestions/:id/accept
Content-Type: application/json

{
  "notes": "Applied to Q2 2025 BAS"
}
```

## Team API

### List Team Members

```http
GET /api/team/members
```

**Response**:
```json
[
  {
    "id": 1,
    "userId": "user_123",
    "email": "employee@example.com",
    "firstName": "Bob",
    "lastName": "Builder",
    "role": "technician",
    "permissions": ["view_jobs", "edit_jobs"],
    "isActive": true,
    "invitedAt": "2024-12-01T00:00:00.000Z",
    "joinedAt": "2024-12-02T00:00:00.000Z"
  }
]
```

### Invite Team Member

```http
POST /api/team/invite
Content-Type: application/json

{
  "email": "newemployee@example.com",
  "role": "technician",
  "permissions": ["view_jobs", "edit_jobs"]
}
```

## AI Chat API

### Send Chat Message

```http
POST /api/ai/chat
Content-Type: application/json

{
  "message": "How many jobs do I have scheduled this week?",
  "conversationId": "conv_123"
}
```

**Rate Limited**: 50 requests/hour

**Response**:
```json
{
  "response": "You have 5 jobs scheduled this week:\n- Monday: Kitchen Renovation (Sydney)\n- Tuesday: Bathroom Repair (Melbourne)\n...",
  "conversationId": "conv_123"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "statusCode": 400
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Validation Error - Input validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server issue |

### Validation Error Example

```json
{
  "error": "Validation error",
  "message": "Invalid input data",
  "statusCode": 422,
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["email"],
      "message": "Expected string, received number"
    }
  ]
}
```

### Rate Limit Error Example

```json
{
  "error": "Rate limit exceeded",
  "message": "You have made too many AI requests. Please try again in an hour.",
  "statusCode": 429,
  "retryAfter": "3600"
}
```

## Webhooks

### Stripe Payment Events

Configure webhook endpoint in Stripe dashboard:

```
https://yourdomain.com/api/webhooks/stripe
```

**Events**:
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `invoice.payment_succeeded` - Subscription payment

### Review Tracking

When a customer clicks a review link:

```http
POST /api/automation/reviews/:token/click [PUBLIC]
```

When a customer submits a review:

```http
POST /api/automation/reviews/:token/complete [PUBLIC]
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent service!"
}
```

## SDKs & Client Libraries

### JavaScript/TypeScript

```bash
npm install @bluetradie/sdk
```

```typescript
import { BlueTradieClient } from '@bluetradie/sdk';

const client = new BlueTradieClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.bluetradie.com'
});

// List jobs
const jobs = await client.jobs.list({ status: 'in-progress' });

// Create invoice
const invoice = await client.invoices.create({
  customerId: 456,
  items: [...]
});
```

### Python

```bash
pip install bluetradie
```

```python
from bluetradie import BlueTradieClient

client = BlueTradieClient(api_key='your-api-key')

# List jobs
jobs = client.jobs.list(status='in-progress')

# Create invoice
invoice = client.invoices.create(
    customer_id=456,
    items=[...]
)
```

## Pagination

For endpoints returning lists, use pagination:

```http
GET /api/jobs?page=2&limit=50
```

**Response includes**:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Versioning

API version is specified in URL:

```
/api/v1/jobs
/api/v2/jobs
```

Current version: **v1** (default, no version prefix required)

## Support

- **API Status**: https://status.bluetradie.com
- **Support Email**: api@bluetradie.com
- **Slack Community**: https://community.bluetradie.com

---

**Last Updated**: January 2025
