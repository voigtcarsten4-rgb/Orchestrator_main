# Finance Data Model

**Module:** Executive Assistant System — Finance  
**Document type:** Data model  
**Last updated:** 2026-04-22

---

## Overview

This document defines the data structures used by the Finance Assistant module. All finance items, position records, and summary outputs must conform to these definitions.

---

## 1. Finance Item Record

The core record for a single financial position.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `item_id` | string | Yes | Unique identifier (UUID or sequential) |
| `type` | enum | Yes | See Item Types below |
| `direction` | enum | Yes | `payable` or `receivable` |
| `counterparty_name` | string | Yes | Name of the other party |
| `counterparty_type` | enum | No | `client` / `supplier` / `authority` / `bank` / `unknown` |
| `amount` | decimal | No | Amount in base currency — `null` if not readable |
| `currency` | string | No | ISO 4217 currency code (e.g. `EUR`) |
| `amount_display` | string | Yes | Human-readable amount or `[AMOUNT-UNKNOWN]` |
| `due_date` | date | No | Due date (`YYYY-MM-DD`) — `null` if not readable |
| `due_date_display` | string | Yes | Human-readable due date or `[DATE-UNKNOWN]` |
| `invoice_number` | string | No | Invoice reference number if extractable |
| `source_type` | enum | Yes | Where this item was identified |
| `source_email_date` | date | No | Date of source email |
| `source_email_subject` | string | No | Subject line of source email |
| `risk_level` | enum | Yes | See Risk Levels in `FINANCE_RISK_LOGIC.md` |
| `status` | enum | Yes | See Item Status below |
| `recurrence` | string | No | `monthly` / `annual` / `one-time` / `unknown` |
| `account_source` | string | No | Which Outlook account surfaced this item |
| `notes` | string | No | Operator or agent notes |
| `created_at` | datetime | Yes | Record creation timestamp |
| `updated_at` | datetime | Yes | Last modification timestamp |

---

## 2. Item Types

| Value | Meaning |
|-------|---------|
| `invoice_inbound` | Invoice received — we owe payment |
| `invoice_outbound` | Invoice sent — payment expected from counterparty |
| `payment_reminder` | Reminder or dunning notice received |
| `subscription` | Recurring service charge |
| `direct_debit` | Automatic bank withdrawal / SEPA mandate |
| `tax_payment` | Tax or levy payment due to authority |
| `insurance` | Insurance premium |
| `loan_repayment` | Loan or credit repayment |
| `refund_pending` | Refund expected — not yet received |
| `unknown` | Cannot be classified from available data |

---

## 3. Item Status

| Value | Meaning |
|-------|---------|
| `open` | Identified but not yet paid or resolved |
| `overdue` | Due date has passed — no payment confirmation |
| `paid` | Payment confirmed |
| `disputed` | Under dispute — do not pay until resolved |
| `cancelled` | Invoice or subscription cancelled |
| `unknown` | Status cannot be determined from available data |

---

## 4. Source Types

| Value | Meaning |
|-------|---------|
| `email_triage` | Identified from email triage output |
| `file_scan` | Found in local file scan (W-11) |
| `operator_entry` | Entered directly by operator |
| `calendar_event` | Inferred from calendar entry |

---

## 5. Finance Summary Record

Aggregated view for reporting and briefing injection.

| Field | Type | Description |
|-------|------|-------------|
| `summary_date` | date | Date of summary generation |
| `total_payable_open` | decimal | Sum of all open payable amounts (known) |
| `total_receivable_open` | decimal | Sum of all open receivable amounts (known) |
| `count_critical` | integer | Number of items at `critical` risk level |
| `count_warning` | integer | Number of items at `warning` risk level |
| `count_informational` | integer | Number of items at `informational` risk level |
| `count_unknown_amount` | integer | Number of items where amount is unknown |
| `top_items` | list | Top 5 items by risk level and amount (for briefing) |
| `pareto_focus` | list | Top items identified by Pareto logic |
| `status` | string | Always `DRAFT` |

---

## 6. Data Flow

```
Source emails / files
        │
        ▼
Finance item extraction (per-item records)
        │
        ▼
Risk classification → risk_level applied
        │
        ▼
Pareto scoring → pareto_focus identified
        │
        ▼
Finance summary record assembled
        │
        ▼
Output: finance-summary.md + briefing section
```

---

## 7. Storage Paths

| Data type | Path |
|-----------|------|
| Individual item records | `/data/drafts/reports/finance/[YYYY-MM-DD]-finance-items.json` |
| Finance summary | `/data/drafts/reports/finance/[YYYY-MM-DD]-finance-summary.md` |
| Approved finance reports | `/data/exports/reports/finance/` |

---

*References: `FINANCE_ASSISTANT_SPEC.md`, `FINANCE_RISK_LOGIC.md`, `FINANCE_PARETO_MODEL.md`*
