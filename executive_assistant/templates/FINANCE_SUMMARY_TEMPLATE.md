# Finance Summary Template

**Module:** Executive Assistant System — Templates  
**Document type:** Markdown template  
**Last updated:** 2026-04-22  
**Usage:** Copy this template and fill in the sections for each finance summary run

---

## How to Use

1. Copy this template
2. Replace all `[PLACEHOLDER]` values with real data
3. Save the completed file to: `reports/[YYYY-MM-DD]-finance-snapshot.md`
4. Mark status as `DRAFT` until operator has reviewed and confirmed

---

---

# Finance Summary — [YYYY-MM-DD]

| Field | Value |
|-------|-------|
| **Source** | Finance Assistant Module |
| **Agent** | A-13 Business Operations Summary Agent |
| **Workflow** | W-12 |
| **Date** | [YYYY-MM-DD HH:MM] |
| **Status** | DRAFT — human review required |
| **Approved by** | [PENDING] |
| **Account scope** | [Business / Private / Both] |

---

## Open Positions Summary

| Category | Count | Total amount (known) |
|----------|-------|---------------------|
| 🔴 Critical — action today | [N] | EUR [X,XXX] |
| 🟡 Warning — action this week | [N] | EUR [X,XXX] |
| 🟢 Informational | [N] | EUR [X,XXX] |
| ⚪ Amount unknown | [N] | — |
| **Total open payables** | | **EUR [X,XXX]** |
| **Total open receivables** | | **EUR [X,XXX]** |

---

## Critical Items — Action Today

| # | Counterparty | Type | Amount | Due date | Pareto score | Recommended action |
|---|-------------|------|--------|----------|-------------|-------------------|
| 1 | [Name] | [invoice_inbound / tax_payment / etc.] | EUR [X,XXX] | [Date or OVERDUE] | [0–100] | [Action text] |
| 2 | | | | | | |

---

## Warning Items — Action This Week

| # | Counterparty | Type | Amount | Due date | Recommended action |
|---|-------------|------|--------|----------|--------------------|
| 1 | [Name] | [Type] | EUR [X,XXX] | [Date] | [Action text] |
| 2 | | | | | |

---

## Informational Items

| # | Counterparty | Type | Amount | Due date |
|---|-------------|------|--------|----------|
| 1 | [Name] | [Type] | EUR [X,XXX] | [Date] |

---

## Items Requiring Operator Input

These items could not be assessed due to missing data:

| Subject | Sender | Email date | Missing data | Action |
|---------|--------|-----------|-------------|--------|
| [Subject] | [Sender] | [Date] | Amount / Due date | Review source email |

---

## Active Subscriptions — This Month

| Service | Amount | Renewal date | Status | Action |
|---------|--------|-------------|--------|--------|
| [Service] | EUR [XX] | [Date] | [Active / Due] | [Keep / Review / Cancel] |

---

## Pareto Focus

**Single highest-leverage action today:**

> [Action sentence] — because [reason in one sentence]

**This week (top 3):**

1. [Action 1] — [leverage/impact]
2. [Action 2] — [leverage/impact]
3. [Action 3] — [leverage/impact]

---

## Confidence Markers

- **[CONFIRMED]** — Amount and date extracted with high confidence
- **[INFERRED]** — Derived from email context — verify before acting
- **[UNCERTAIN]** — Low-confidence extraction — check source
- **[MISSING]** — Data not available — see "Items Requiring Operator Input" above

---

## Next Steps

1. Review Critical items and take or schedule action today
2. Plan Warning items for this week
3. Verify items marked [MISSING] by checking source emails
4. Return this document with status changed from `DRAFT` to `REVIEWED` after completing your review

---

*This is a DRAFT document. No financial action has been taken. All items require human decision before any payment or response.*
