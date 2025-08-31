# Blue Tradie Public API Schema

## Overview
Future-proof API documentation for Blue Tradie platform extensibility, 3rd-party integrations, and developer marketplace. This schema is designed to support regional expansion and custom use cases.

## Authentication
```
POST /api/auth/token
Headers: 
  Authorization: Bearer <developer_api_key>
  X-User-ID: <user_id>
```

## Core Resources

### Jobs Management
```
GET    /api/v1/jobs              # List user's jobs
POST   /api/v1/jobs              # Create new job
GET    /api/v1/jobs/{id}         # Get specific job
PATCH  /api/v1/jobs/{id}         # Update job
DELETE /api/v1/jobs/{id}         # Delete job

# Job Object Schema
{
  "id": "string",
  "customer": {
    "name": "string",
    "email": "string", 
    "phone": "string",
    "address": "string"
  },
  "title": "string",
  "description": "string",
  "status": "scheduled|in-progress|completed|cancelled",
  "scheduled_date": "ISO8601",
  "completion_date": "ISO8601",
  "estimated_hours": "number",
  "actual_hours": "number",
  "materials": [{
    "name": "string",
    "quantity": "number",
    "cost": "number"
  }],
  "notes": "string",
  "location": {
    "address": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    }
  },
  "metadata": {
    "source": "blue_tradie|import|api",
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

### Invoice Management
```
GET    /api/v1/invoices          # List invoices
POST   /api/v1/invoices          # Create invoice
GET    /api/v1/invoices/{id}     # Get specific invoice
PATCH  /api/v1/invoices/{id}     # Update invoice
DELETE /api/v1/invoices/{id}     # Delete invoice

# Invoice Object Schema
{
  "id": "string",
  "invoice_number": "string",
  "customer": {
    "name": "string",
    "email": "string",
    "address": "string"
  },
  "line_items": [{
    "description": "string",
    "quantity": "number",
    "rate": "number",
    "amount": "number"
  }],
  "subtotal": "number",
  "gst_rate": "number",      # Auto-set based on user's country (10% AU, 15% NZ)
  "gst_amount": "number",
  "total": "number",
  "status": "draft|sent|paid|overdue",
  "issue_date": "ISO8601",
  "due_date": "ISO8601",
  "paid_date": "ISO8601",
  "currency": "AUD|NZD",     # Auto-set based on user's country
  "payment_method": "string",
  "notes": "string",
  "metadata": {
    "job_id": "string",      # Link to associated job
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

### AI Agent Integration
```
POST   /api/v1/ai/chat          # Send message to AI agent
GET    /api/v1/ai/history       # Get chat history
DELETE /api/v1/ai/history       # Clear chat history

# Chat Request Schema
{
  "agent_type": "accountant|marketing|coach|legal",
  "message": "string",
  "context": {
    "user_country": "Australia|New Zealand",
    "business_type": "solo|team|family",
    "user_preferences": {
      "tone": "casual|professional|friendly",
      "experience_level": "beginner|intermediate|advanced"
    }
  }
}

# Chat Response Schema
{
  "message": "string",
  "suggestions": ["string"],
  "actions": [{
    "type": "create_invoice|schedule_job|export_data",
    "label": "string",
    "payload": "object"
  }],
  "metadata": {
    "agent": "string",
    "response_time": "number",
    "tokens_used": "number"
  }
}
```

### Customer Management
```
GET    /api/v1/customers        # List customers
POST   /api/v1/customers        # Create customer
GET    /api/v1/customers/{id}   # Get specific customer
PATCH  /api/v1/customers/{id}   # Update customer
DELETE /api/v1/customers/{id}   # Delete customer

# Customer Object Schema
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": {
    "street": "string",
    "suburb": "string",
    "state": "string",
    "postcode": "string",
    "country": "Australia|New Zealand"
  },
  "business_name": "string",
  "abn_acn": "string",         # Australia: ABN, NZ: NZBN
  "notes": "string",
  "tags": ["string"],
  "preferred_contact": "email|phone|sms",
  "metadata": {
    "total_jobs": "number",
    "total_revenue": "number",
    "last_job_date": "ISO8601",
    "customer_since": "ISO8601"
  }
}
```

## Business Intelligence & Analytics
```
GET    /api/v1/analytics/revenue     # Revenue analytics
GET    /api/v1/analytics/jobs        # Job performance metrics
GET    /api/v1/analytics/customers   # Customer insights
GET    /api/v1/analytics/ai-usage    # AI agent usage stats

# Analytics Response Schema
{
  "period": {
    "start": "ISO8601",
    "end": "ISO8601"
  },
  "revenue": {
    "total": "number",
    "monthly": "number",
    "growth_rate": "number",
    "currency": "AUD|NZD"
  },
  "jobs": {
    "total": "number",
    "completed": "number",
    "in_progress": "number",
    "completion_rate": "number",
    "average_duration": "number"
  },
  "customers": {
    "total": "number",
    "new": "number",
    "returning": "number",
    "retention_rate": "number"
  },
  "ai_usage": {
    "total_interactions": "number",
    "by_agent": {
      "accountant": "number",
      "marketing": "number", 
      "coach": "number",
      "legal": "number"
    },
    "popular_topics": ["string"]
  }
}
```

## Data Import/Export
```
POST   /api/v1/import/servicem8    # Import from ServiceM8
POST   /api/v1/import/tradify      # Import from Tradify  
POST   /api/v1/import/csv          # Import from CSV
GET    /api/v1/export/backup       # Full data export
GET    /api/v1/export/tax-ready    # Tax-ready export (AU: BAS, NZ: GST)

# Import Request Schema
{
  "source": "servicem8|tradify|csv|manual",
  "data_types": ["jobs", "customers", "invoices", "expenses"],
  "credentials": {
    "api_key": "string",
    "account_id": "string"
  },
  "options": {
    "merge_duplicates": "boolean",
    "date_range": {
      "start": "ISO8601",
      "end": "ISO8601"
    }
  }
}

# Import Response Schema
{
  "import_id": "string",
  "status": "processing|completed|failed",
  "summary": {
    "jobs_imported": "number",
    "customers_imported": "number", 
    "invoices_imported": "number",
    "errors": "number"
  },
  "errors": [{
    "type": "validation|conflict|system",
    "message": "string",
    "item": "object"
  }]
}
```

## Regional Compliance
```
GET    /api/v1/compliance/tax-rates    # Get current tax rates
GET    /api/v1/compliance/requirements # Get regional requirements
GET    /api/v1/compliance/templates    # Get legal templates

# Regional Response Schema
{
  "country": "Australia|New Zealand",
  "tax": {
    "gst_rate": "0.10|0.15",
    "authority": "ATO|IRD",
    "filing_frequency": "quarterly|monthly",
    "next_due_date": "ISO8601"
  },
  "legal": {
    "business_id_type": "ABN|NZBN",
    "required_insurance": ["public_liability", "workers_compensation"],
    "contract_templates": [{
      "type": "trade_contract|quote_template",
      "url": "string",
      "last_updated": "ISO8601"
    }]
  },
  "formatting": {
    "currency": "AUD|NZD",
    "date_format": "DD/MM/YYYY",
    "phone_format": "+61|+64"
  }
}
```

## Webhooks
```
POST   /api/v1/webhooks             # Create webhook
GET    /api/v1/webhooks             # List webhooks
DELETE /api/v1/webhooks/{id}        # Delete webhook

# Webhook Events
- job.created
- job.completed
- invoice.paid
- customer.created
- ai.interaction
- payment.received

# Webhook Payload Schema
{
  "event": "string",
  "timestamp": "ISO8601",
  "data": "object",
  "user_id": "string",
  "webhook_id": "string"
}
```

## Rate Limits
- Public API: 1000 requests/hour per API key
- AI Endpoints: 100 requests/hour per user
- Import Endpoints: 10 requests/hour per user
- Webhook Deliveries: 5 retry attempts with exponential backoff

## Error Responses
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [{
      "field": "email",
      "code": "INVALID_FORMAT",
      "message": "Email address is not valid"
    }]
  },
  "request_id": "string",
  "timestamp": "ISO8601"
}
```

## Developer Marketplace Integration

### Plugin System
```
POST   /api/v1/plugins/install      # Install marketplace plugin
GET    /api/v1/plugins/installed    # List installed plugins
DELETE /api/v1/plugins/{id}         # Uninstall plugin

# Plugin Schema
{
  "id": "string",
  "name": "string",
  "version": "string",
  "developer": "string",
  "description": "string",
  "permissions": ["read:jobs", "write:invoices", "ai:interact"],
  "webhook_endpoints": ["string"],
  "configuration": "object"
}
```

### Custom Automations
```
POST   /api/v1/automations          # Create automation
GET    /api/v1/automations          # List automations
PATCH  /api/v1/automations/{id}     # Update automation

# Automation Schema
{
  "name": "string",
  "trigger": {
    "type": "event|schedule|webhook",
    "config": "object"
  },
  "actions": [{
    "type": "ai_chat|create_invoice|send_email|http_request",
    "config": "object"
  }],
  "enabled": "boolean"
}
```

## Country-Specific Extensions

### Australia Extensions
```
GET    /api/v1/au/ato-integration   # ATO reporting integration
POST   /api/v1/au/bas-export        # Export BAS-ready data
GET    /api/v1/au/abn-lookup        # Validate ABN numbers
```

### New Zealand Extensions  
```
GET    /api/v1/nz/ird-integration   # IRD reporting integration
POST   /api/v1/nz/gst-export        # Export GST-ready data
GET    /api/v1/nz/nzbn-lookup       # Validate NZBN numbers
```

## Future Expansion Framework

### Multi-Country Support
- Extensible country configuration system
- Localized tax rates and legal requirements
- Regional AI training and language preferences
- Currency and formatting standards

### Enterprise Features
- Multi-user team management
- Role-based access control
- Advanced reporting and analytics
- Custom branding and white-labeling

### Integration Ecosystem
- Accounting software (Xero, MYOB, Sage)
- Payment processors (Stripe, Square, PayPal)
- CRM systems (HubSpot, Salesforce)
- Project management (Asana, Monday.com)

This API schema provides the foundation for scalable growth while maintaining the core Blue Tradie values of simplicity and regional focus.