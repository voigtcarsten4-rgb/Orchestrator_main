# Outlook Label Model

**Module:** Executive Assistant System  
**Document type:** Email classification taxonomy  
**Last updated:** 2026-04-22

---

## Purpose

This document defines the label / category taxonomy for classifying emails in Outlook. Labels are used during the audit phase to tag emails and later to drive rule-based auto-classification.

In Outlook, labels correspond to **Categories** (coloured tags assignable to emails, calendar events, and contacts). They are not folders — an email can carry multiple labels.

---

## Primary Classification Labels

### Priority Labels

| Label | Colour (suggested) | Meaning |
|-------|--------------------|---------|
| `ACTION-TODAY` | Red | Requires operator action today |
| `ACTION-THIS-WEEK` | Orange | Requires action within this week |
| `WAITING-FOR` | Yellow | Sent — awaiting reply or action from someone else |
| `FOLLOW-UP` | Blue | Conversation that needs follow-up in future |
| `READ-LATER` | Grey | No immediate action — reference or background reading |

### Type Labels

| Label | Meaning |
|-------|---------|
| `INVOICE-INBOUND` | Invoice received — operator owes payment |
| `INVOICE-OUTBOUND` | Invoice sent — payment expected |
| `PAYMENT-REMINDER` | Reminder received for a payment due |
| `SUBSCRIPTION` | Recurring service or membership correspondence |
| `AUTHORITY` | Correspondence from government, tax, legal, regulatory bodies |
| `LEGAL` | Contracts, legal notices, NDA, terms |
| `CONTRACT` | Signed agreements and contract correspondence |
| `CLIENT` | Correspondence with a paying client |
| `SUPPLIER` | Correspondence with a supplier or vendor |
| `PARTNER` | Strategic or collaborative relationship |
| `INTERNAL` | Internal team communications |
| `NEWSLETTER` | Non-actionable subscription content |
| `SPAM-CANDIDATE` | Suspected spam — flag for operator decision before deletion |
| `PERSONAL` | Private correspondence |

### State Labels

| Label | Meaning |
|-------|---------|
| `DRAFT-REPLY` | A draft reply exists or has been prepared by the assistant |
| `ARCHIVED` | Processed — no further action needed |
| `ESCALATED` | Flagged to a higher priority — needs human attention |
| `DUPLICATE` | Identified as a duplicate thread or message |

---

## Label Application Rules

1. Every email that requires action must carry exactly one Priority Label
2. Type Labels are additive — an email can carry multiple (e.g. `INVOICE-INBOUND` + `ACTION-TODAY`)
3. State Labels are applied after processing, not during triage
4. `NEWSLETTER` and `SPAM-CANDIDATE` labels suppress Priority Labels — these items are not actionable
5. The assistant assigns labels as part of the audit DRAFT — the operator approves before any label is applied in Outlook

---

## Label Colours in Outlook

Outlook supports up to 25 named colour categories. Recommended colour assignments:

| Colour | Labels |
|--------|--------|
| Red | `ACTION-TODAY`, `AUTHORITY`, `LEGAL` |
| Orange | `ACTION-THIS-WEEK`, `INVOICE-INBOUND`, `PAYMENT-REMINDER` |
| Yellow | `WAITING-FOR`, `INVOICE-OUTBOUND` |
| Blue | `FOLLOW-UP`, `CLIENT`, `PARTNER` |
| Green | `CONTRACT`, `SUPPLIER` |
| Purple | `PERSONAL`, `INTERNAL` |
| Grey | `READ-LATER`, `NEWSLETTER`, `ARCHIVED` |
| Pink | `SPAM-CANDIDATE` |

---

## Workflow Integration

Labels feed into:
- Email triage reports (A-09)
- Daily briefing finance section (A-11 + A-13)
- Contact extraction (relationship type inference)
- Outlook folder routing rules (see `OUTLOOK_TARGET_MODEL.md`)

---

*References: `OUTLOOK_TARGET_MODEL.md`, `TARGET_ARCHITECTURE.md`*
