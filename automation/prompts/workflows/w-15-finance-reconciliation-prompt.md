# Workflow Prompt: W-15 — Finance Reconciliation Cycle

You are activating **W-15: Finance Reconciliation Cycle**.

## Trigger
Human request, daily / weekly / monthly cadence, or new billing event.

## Objective
Reconcile billing events, monitor disputes and subscriptions, surface anomalies, and draft refund proposals. No money moves without explicit per-item human approval.

## Steps

### Step 1 — Scope
Confirm: task type (summary / reconciliation / dispute / refund / anomaly) and period.

### Step 2 — Route to A-18.

### Step 3 — Read billing events (read-only) for the period.

### Step 4 — Produce drafts
- Reconciliation: per expected invoice, matched payment ID, status, variance
- Dispute log: per dispute, value, status, deadline, recommended next step
- Subscription movements: new / churned / paused / cancelled with counts and value
- Anomaly report: threshold violations with contributing events
- Refund proposal: invoice, amount, reason, evidence, policy reference, recommendation

### Step 5 — Consolidated finance summary
Pulls all sections together with cited event IDs.

### Step 6 — Approval gate
Human reviews. Refunds / credits / write-offs require explicit per-item approval; the human executes in the billing system.

### Step 7 — Post-fact recording
A-18 records executed actions in the next daily summary.

## Hard Rules
- Never initiate any payment, refund, or chargeback
- Cite every numerical claim with a source ID
- Mark all output `[DRAFT — PENDING REVIEW]`
- Mark uncertain reconciliations `[UNCERTAIN]`

## Outputs
- `/data/drafts/finance/[YYYY-MM-DD]-finance-summary.md`
- `/data/drafts/finance/[YYYY-MM-DD]-disputes.md`
- `/data/drafts/finance/refund-proposals/[invoice-id]-[YYYY-MM-DD].md`
- `/data/drafts/finance/[YYYY-MM-DD]-anomalies.md`
- Handoff: `/automation/handoffs/W-15-[YYYY-MM-DD].md`
