# Finance Assistant Specification

**Module:** Executive Assistant System — Finance  
**Document type:** Module specification  
**Last updated:** 2026-04-22

---

## Purpose

The Finance Assistant provides a structured, read-only view of the operator's open financial positions, risk exposures, and cash flow obligations. It does not access banking systems, make payments, or modify any financial records. It reads available email data and file scan outputs to produce a structured summary.

---

## Scope

### In scope

- Open and overdue invoices (inbound and outbound) identified from email data
- Payment reminders and dunning notices received
- Recurring subscriptions and direct debit schedules
- Approaching due dates within configurable look-ahead windows
- Finance items found in local file scans (W-11 output)
- Risk classification of all identified positions
- Pareto analysis: which positions carry the most financial risk or opportunity

### Out of scope

- Payments, transfers, or any financial transaction
- Access to bank accounts, payment platforms, or accounting software (unless integration formally approved)
- Tax advice or legal financial guidance
- Budget planning or forecasting (beyond what is inferable from open positions)

---

## Data Sources

| Source | What is extracted | How accessed |
|--------|------------------|-------------|
| Email triage output | Invoice and reminder emails | Read from `/data/drafts/email/` |
| File scan output | Finance documents found in local folders | Read from `/data/inbox/` (W-11 output) |
| Operator-provided input | Direct entry of known positions | Operator fills in template |

No live connection to a bank, accounting tool, or ERP system is active in Phase 1 or Phase 2.

---

## Processing Pipeline

```
Email triage output (A-09)
        │
        ▼
Finance item extraction
  - Identify finance-relevant emails using label taxonomy
  - Extract: sender, subject, date, amount (if readable from subject/snippet)
  - Classify: type, direction, status
        │
        ▼
Risk classification (see FINANCE_RISK_LOGIC.md)
        │
        ▼
Pareto scoring (see FINANCE_PARETO_MODEL.md)
        │
        ▼
Finance summary DRAFT
  - Written to /data/drafts/reports/finance/[YYYY-MM-DD]-finance-summary.md
  - Finance section injected into daily CEO briefing
```

---

## Finance Item Record

Each identified finance item contains:

| Field | Description |
|-------|-------------|
| `item_id` | Unique identifier |
| `type` | `invoice_inbound` / `invoice_outbound` / `reminder` / `subscription` / `unknown` |
| `direction` | `payable` (we owe) / `receivable` (owed to us) |
| `counterparty` | Name of supplier, client, or authority |
| `amount` | Amount if readable — otherwise `[AMOUNT-UNKNOWN]` |
| `currency` | Currency code (EUR, USD, etc.) |
| `due_date` | Due date if readable — otherwise `[DATE-UNKNOWN]` |
| `source_email_date` | Date of the email that surfaced this item |
| `source_email_subject` | Subject line of the source email |
| `risk_level` | `critical` / `warning` / `informational` (see FINANCE_RISK_LOGIC.md) |
| `status` | `open` / `overdue` / `paid` / `unknown` |
| `notes` | Free text for context |

---

## Output Files

| File | Path | Purpose |
|------|------|---------|
| Finance summary | `/data/drafts/reports/finance/[YYYY-MM-DD]-finance-summary.md` | Full finance DRAFT report |
| Briefing finance section | Injected into `/assets/briefings/[YYYY-MM-DD]-ceo-briefing.md` | Concise version for daily briefing |

---

## Approval and Governance

- All finance output is DRAFT — no financial action is taken automatically
- Finance items flagged as `critical` appear at the top of the daily briefing
- The operator decides what action to take on each item
- No payment is ever initiated by the system

---

## Suggested Keyword List for Email Detection

The following keywords (case-insensitive) trigger finance item extraction during email triage:

**German:** rechnung, mahnung, zahlungserinnerung, fälligkeit, offene posten, lastschrift, abbuchung, bankeinzug, rückstand, mahngebühr, inkasso, abonnement, jahresbeitrag, monatsbeitrag

**English:** invoice, overdue, payment due, reminder, past due, subscription, direct debit, debit notice, outstanding balance, amount due, final notice, collection

---

*References: `FINANCE_DATA_MODEL.md`, `FINANCE_RISK_LOGIC.md`, `FINANCE_PARETO_MODEL.md`, `FINANCE_BRIEFING_EXTENSION.md`*
