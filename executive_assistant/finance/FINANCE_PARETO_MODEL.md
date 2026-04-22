# Finance Pareto Model

**Module:** Executive Assistant System — Finance  
**Document type:** Pareto prioritisation framework  
**Last updated:** 2026-04-22

---

## Core Principle

Not all financial positions deserve equal attention. The Pareto model identifies the 20 % of finance items that drive 80 % of financial risk, cash flow impact, or opportunity. The result is a short, actionable focus list — not a complete ledger.

The question this model answers every day:

> **"If I can only act on one or two financial items today, which ones create the biggest difference?"**

---

## Pareto Scoring Dimensions

Each finance item receives a Pareto score based on four dimensions:

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| Financial magnitude | 35 % | Amount as a proportion of total open position |
| Time pressure | 35 % | How urgently action is needed (days to due date, overdue status) |
| Relationship sensitivity | 15 % | Risk to a key business relationship if delayed |
| Compounding risk | 15% | Whether inaction triggers a cascade (legal, credit, operational) |

**Total score: 0–100**

---

## Scoring Rules

### Dimension 1 — Financial Magnitude (35 points max)

| Condition | Points |
|-----------|--------|
| Item represents > 50 % of total open payables | 35 |
| Item represents 25–50 % of total open payables | 25 |
| Item represents 10–25 % of total open payables | 15 |
| Item represents < 10 % of total open payables | 5 |
| Amount unknown | 10 (conservative estimate — unknown = potentially significant) |

### Dimension 2 — Time Pressure (35 points max)

| Condition | Points |
|-----------|--------|
| Overdue — days past due ≥ 30 | 35 |
| Overdue — days past due 1–29 | 30 |
| Due today | 35 |
| Due in 1–3 days | 25 |
| Due in 4–7 days | 15 |
| Due in 8–30 days | 5 |
| Due date unknown | 10 |

### Dimension 3 — Relationship Sensitivity (15 points max)

| Condition | Points |
|-----------|--------|
| Key client — outstanding receivable | 15 |
| Key supplier — overdue payable | 12 |
| Authority / legal — any open position | 15 |
| Standard supplier — overdue | 8 |
| One-time or low-significance counterparty | 3 |
| Unknown relationship type | 5 |

### Dimension 4 — Compounding Risk (15 points max)

| Condition | Points |
|-----------|--------|
| Dunning / Inkasso / legal collection in progress | 15 |
| Second or third reminder received | 12 |
| First reminder received | 7 |
| Subscription cancellation risk if not paid | 10 |
| Service interruption risk if not paid | 10 |
| No escalation risk identified | 3 |

---

## Pareto Focus Selection

After scoring, the Pareto Focus List is the top items meeting any of these criteria:

1. **Score ≥ 70** — always included
2. **Score 50–69 AND amount > 1,000 EUR** — included if in top 5 by score
3. **Any item flagged `critical`** — always included regardless of score

The Pareto Focus List contains a maximum of **5 items** to preserve focus. If more than 5 items qualify, include the highest-scoring 5.

---

## Weekly Pareto View

Each Monday, the briefing includes a weekly Pareto view:

| Focus | Question |
|-------|---------|
| **Today** | What is the single highest-leverage finance action for today? |
| **This week** | Which 2–3 items, if resolved this week, clear the most financial risk? |
| **Next 30 days** | What approaching obligations should be prepared for now? |
| **Receivables** | Which outstanding invoices can be collected with a short follow-up? |

---

## Leverage Identification

Beyond risk mitigation, the Pareto model also identifies positive leverage:

| Opportunity | Signal |
|-------------|--------|
| Overdue receivable from active client | A short follow-up call recovers cash |
| Subscription not used | Cancellation frees recurring cost |
| Supplier with overdue payable | Proactive contact prevents relationship damage |
| Authority item with unclear status | Early clarification prevents escalation |

---

## Output in Briefing

The Finance Pareto section in the daily CEO briefing contains:

1. **Pareto Focus List** — top items with score, amount, due date, and recommended action
2. **Leverage Summary** — one sentence per item: "Paying [supplier] today prevents a third reminder and potential credit hold"
3. **Weekly focus** (Mondays only) — three-item action list for the week

---

## Example

| # | Item | Score | Risk | Amount | Due | Recommended action |
|---|------|-------|------|--------|-----|-------------------|
| 1 | Supplier invoice — overdue 32 days | 88 | 🔴 | 3,400 EUR | Overdue | Pay immediately — third reminder imminent |
| 2 | Tax prepayment — due in 2 days | 82 | 🔴 | 1,800 EUR | 2 days | Schedule payment today |
| 3 | Client invoice — 18 days overdue | 71 | 🔴 | 5,200 EUR | Overdue | Send follow-up email this morning |
| 4 | Annual SaaS subscription — due in 5 days | 52 | 🟡 | 890 EUR | 5 days | Confirm if still needed; pay or cancel |

---

*References: `FINANCE_RISK_LOGIC.md`, `FINANCE_DATA_MODEL.md`, `FINANCE_BRIEFING_EXTENSION.md`*
