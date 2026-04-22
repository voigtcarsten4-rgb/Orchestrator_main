# Finance Briefing Extension

**Module:** Executive Assistant System — Finance  
**Document type:** Briefing integration spec  
**Last updated:** 2026-04-22

---

## Purpose

Defines exactly how the Finance Assistant output is integrated into the daily CEO briefing. This document is the interface specification between the Finance module and the Briefing module.

---

## Finance Section in the Daily Briefing

The finance section is injected into the CEO briefing as Section F. It appears after the Risk Register and before the Quick Wins section.

---

## Section F — Finance Status

### F.1 — Finance Alert Bar

Displayed only when one or more `critical` items exist.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 FINANCE ALERT — [N] critical items require action today
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### F.2 — Open Positions Summary

| Category | Count | Total known amount |
|----------|-------|--------------------|
| 🔴 Critical — action today | N | EUR X,XXX |
| 🟡 Warning — action this week | N | EUR X,XXX |
| 🟢 Informational | N | EUR X,XXX |
| ⚪ Amount unknown | N | — |

**Total open payables (known amounts):** EUR X,XXX  
**Total open receivables (known amounts):** EUR X,XXX

### F.3 — Pareto Focus List

The top items identified by the Finance Pareto Model (`FINANCE_PARETO_MODEL.md`):

| # | Counterparty | Type | Amount | Due | Risk | Action |
|---|-------------|------|--------|-----|------|--------|
| 1 | [Name] | Invoice inbound | EUR X,XXX | [Date or OVERDUE] | 🔴 | [Action text] |
| 2 | [Name] | Tax payment | EUR X,XXX | [Date] | 🔴 | [Action text] |
| 3 | [Name] | Client invoice | EUR X,XXX | OVERDUE | 🔴 | [Action text] |

### F.4 — Finance Items Requiring Operator Input

Items that could not be assessed due to missing data:

| Item | Reason | Email date |
|------|--------|-----------|
| [Subject] | Amount not readable | [Date] |
| [Subject] | Due date not readable | [Date] |

### F.5 — Subscriptions Due This Month

Recurring items with known renewal dates this month:

| Service | Amount | Renewal date | Status |
|---------|--------|-------------|--------|
| [Service name] | EUR XX | [Date] | Active |

---

## Injection Rules

| Rule | Detail |
|------|--------|
| Finance section is always included | Even if no critical items — shows green status if all clear |
| Finance Alert Bar | Only shown if ≥ 1 critical item |
| Pareto Focus List | Always shows top items — max 5 |
| Missing data items | Shown if any exist — operator must review |
| Subscription list | Always shown if items exist this month |
| If no finance data available | Show: "No finance data available for today — run Finance extraction first" |

---

## Weekly Finance Summary (Mondays)

On Mondays, the finance section is expanded with a 30-day view:

### F.6 — 30-Day Financial Horizon (Mondays only)

| Week | Items due | Total amount (known) | Risk level |
|------|-----------|---------------------|-----------|
| This week (Mon–Sun) | N | EUR X,XXX | 🔴 / 🟡 / 🟢 |
| Next week | N | EUR X,XXX | — |
| Week 3 | N | EUR X,XXX | — |
| Week 4 | N | EUR X,XXX | — |

**Biggest week:** Week X — EUR X,XXX due  
**Recommended preparation:** [One sentence summary]

---

## Confidence Markers

All finance data in the briefing carries confidence markers:

| Marker | Meaning |
|--------|---------|
| `[CONFIRMED]` | Amount and due date extracted with high confidence |
| `[INFERRED]` | Amount or date inferred from context — verify before acting |
| `[UNCERTAIN]` | Low-confidence extraction — operator must review source |
| `[MISSING]` | Required data not available — see F.4 |

---

## Output Format

The finance section is written in Markdown with emoji risk indicators. It is designed to be readable:
- Without rendering (plain text)
- In a rendered Markdown viewer
- When copied into an email to the operator

---

*References: `FINANCE_PARETO_MODEL.md`, `FINANCE_RISK_LOGIC.md`, `briefing/BRIEFING_EXPANSION_PLAN.md`*
