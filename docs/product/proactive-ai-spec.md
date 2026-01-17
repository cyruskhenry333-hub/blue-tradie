# Proactive AI Specification

## What's Proactive vs Reactive?

| Type | Description | Example |
|------|-------------|---------|
| **Reactive** | You ask, AI answers | "How do I claim GST on my ute?" |
| **Proactive** | AI notices something, nudges you | "Invoice #42 is 7 days overdue—want to send a reminder?" |

Proactive AI watches your business data and reaches out when something needs attention. You stay in control—every nudge can be dismissed, snoozed, or turned off.

---

## Advisor Types

| Advisor | What It Does |
|---------|--------------|
| **Business/Admin Coach** | Helps with invoicing, quoting, job management, cash flow |
| **Marketing Coach** | Suggests ways to get more jobs, improve your online presence |
| **Compliance/Tax Helper** | Reminds you about GST, BAS, ABN renewals, insurance expiry |
| **Motivational Coach** | Encouragement during slow periods, celebrates wins |
| **Customer Comms Assistant** | Drafts follow-up messages, thank-you notes, review requests |

---

## Trigger Examples

| Trigger | Nudge |
|---------|-------|
| Invoice overdue by X days | "Invoice #42 is 7 days overdue. Send a reminder?" |
| Quote not followed up in X days | "You sent a quote to John 5 days ago—no response. Follow up?" |
| Job scheduled tomorrow | "Tomorrow: Kitchen reno at 123 Smith St. Here's your prep checklist." |
| Low cash flow detected | "Cash flow looks tight next week. Here are 3 actions to improve it." |
| Missing expense receipt | "You added 'Bunnings $85' but no receipt photo. Snap one now?" |
| Insurance expiring soon | "Your public liability expires in 14 days. Time to renew." |

---

## User Controls

### Per-Advisor Toggle
Turn each advisor on/off independently. Don't want marketing tips? Turn off Marketing Coach.

### Quiet Hours
Set times when you won't get nudges (e.g., 6pm–7am, weekends).

### Frequency Caps
- **Daily cap**: Max nudges per day (e.g., 5)
- **Weekly cap**: Max nudges per week (e.g., 20)

### Snooze/Dismiss
- **Snooze**: "Remind me tomorrow" / "Remind me in 3 days"
- **Dismiss**: "Got it, don't remind me about this one"

---

## Audit Log Requirements

Every proactive nudge is logged for transparency and learning.

| Field | Description |
|-------|-------------|
| `userId` | Who received the nudge |
| `orgId` | Which business (for Team plans) |
| `advisorType` | Which advisor sent it |
| `triggerType` | What triggered it (e.g., `overdue_invoice`) |
| `createdAt` | When the nudge was created |
| `deliveredAt` | When the nudge was shown to user |
| `outcome` | `accepted` / `dismissed` / `snoozed` |
| `metadata` | Related IDs (e.g., `jobId`, `invoiceId`, `quoteId`) |

---

## Safety Rules

1. **Never auto-send customer messages without confirmation**
   - Drafts require user approval before sending
   - Future: optional "auto-send" setting, but OFF by default and requires explicit opt-in

2. **Never modify money totals without confirmation**
   - Invoice amounts, quote prices, expense values always require user approval

3. **Store all nudges + outcomes**
   - For learning: understand what's helpful vs annoying
   - For analytics: measure proactive value
   - For user: "Here's what I nudged you about this month"
