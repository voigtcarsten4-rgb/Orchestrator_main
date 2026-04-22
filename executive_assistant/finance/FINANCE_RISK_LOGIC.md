# Finance Risk Logic

**Module:** Executive Assistant System — Finance  
**Document type:** Risk classification rules  
**Last updated:** 2026-04-22

---

## Purpose

Defines how each identified finance item is classified by risk level. The classification drives where items appear in the daily briefing and how urgently the operator is prompted to act.

---

## Risk Levels

| Level | Visual indicator | Meaning |
|-------|-----------------|---------|
| `critical` | 🔴 RED | Requires action today — overdue or same-day due |
| `warning` | 🟡 YELLOW | Requires action this week — due within 7 days |
| `informational` | 🟢 GREEN | No immediate action — due in more than 7 days or status unclear |
| `unknown` | ⚪ GREY | Cannot be assessed — amount or date missing; operator must review |

---

## Classification Rules

Rules are applied in order. The first matching rule assigns the risk level. If no rule matches, the item is classified `unknown`.

### CRITICAL — Action required today

| Condition | Applies to |
|-----------|-----------|
| Due date is today or in the past | All payable items |
| Subject or body contains: `letzte mahnung`, `inkasso`, `pfändung`, `gerichtlich`, `final notice`, `collection`, `legal action` | All items |
| Amount > 10,000 EUR and status is `overdue` | Payables |
| Authority correspondence with explicit deadline today | `tax_payment`, `authority` items |

### WARNING — Action required this week

| Condition | Applies to |
|-----------|-----------|
| Due date is within the next 7 calendar days | All payable items |
| Payment reminder received (first or second notice) | `payment_reminder` items |
| Subscription or direct debit due within 7 days | `subscription`, `direct_debit` |
| Outbound invoice overdue by more than 14 days | Receivables with `status: overdue` |
| Authority correspondence with deadline this week | `tax_payment`, `authority` items |

### INFORMATIONAL — No immediate action

| Condition | Applies to |
|-----------|-----------|
| Due date is 8 or more days away | All payable items |
| Subscription confirmed and active — no issue | `subscription` with `status: open` |
| Invoice sent and within normal payment terms | Receivables with `status: open` |
| Refund expected — within expected timeframe | `refund_pending` |

### UNKNOWN — Operator review required

| Condition | Action |
|-----------|--------|
| Due date not readable from email | Flag for operator |
| Amount not readable | Flag for operator |
| Status cannot be determined | Flag for operator |
| Conflicting signals (e.g. paid and reminder received) | Flag — possible data sync issue |

---

## Escalation Thresholds

The following thresholds determine when the Finance Assistant raises an alert at the top of the briefing (above normal priority):

| Scenario | Threshold | Alert |
|----------|-----------|-------|
| Total overdue payables (known amounts) | > 5,000 EUR | 🔴 FINANCE ALERT — total overdue amount exceeds threshold |
| Critical items count | ≥ 3 items | 🔴 FINANCE ALERT — multiple critical items require action today |
| Days past due for any single item | ≥ 30 days | 🔴 ESCALATED ITEM — serious overdue position |
| Authority item without clear resolution | Any | 🔴 AUTHORITY FLAG — unresolved authority correspondence |

Thresholds are defaults. The operator may adjust them.

---

## Examples

| Item | Risk level | Reason |
|------|-----------|--------|
| Invoice from supplier, due yesterday | `critical` | Overdue |
| Tax payment due in 3 days | `warning` | Due within 7 days |
| Subscription renewal due in 20 days | `informational` | More than 7 days away |
| Reminder email — amount not readable | `unknown` | Missing data |
| Client invoice 45 days overdue, no payment | `critical` | Overdue receivable > 30 days |
| Annual insurance premium due in 10 days | `informational` | More than 7 days |
| Inkasso letter received today | `critical` | Keyword match: `inkasso` |

---

## Integration with Briefing

Risk level determines placement in the daily briefing:

- `critical` items → top of Finance section, with red flag
- `warning` items → main Finance section body
- `informational` items → Finance section appendix or condensed view
- `unknown` items → separate "Requires operator input" block in Finance section

---

*References: `FINANCE_ASSISTANT_SPEC.md`, `FINANCE_DATA_MODEL.md`, `FINANCE_PARETO_MODEL.md`*
