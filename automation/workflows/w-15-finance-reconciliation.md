# Workflow W-15: Finance Reconciliation Cycle

**ID:** W-15
**Status:** Active — high-risk, draft-only
**Primary Agent:** A-18 Finance Agent
**Trigger:** Daily / weekly / monthly cadence, billing event, or human request

---

## Purpose

Reconcile billing events with expected invoices, monitor disputes and subscription movements, surface anomalies, and draft refund proposals. No money moves without explicit per-item human approval.

---

## Trigger Conditions

- T-01-12 — Human requests a finance view
- T-03-09 — Daily finance summary schedule (when enabled, requires Stripe MCP)
- New billing event from connector (when integration approved)

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Confirm task type (summary / reconciliation / dispute / refund / anomaly) and period | A-01 | Request | Scope definition | None |
| 2 | A-01 routes to A-18 | A-01 | Scope | Task assignment | None |
| 3 | A-18 reads billing events for the period (read-only) | A-18 | Billing connector | Event set | None |
| 4 | A-18 reconciles against expected invoices | A-18 | Event set + reference | Reconciliation table | None |
| 5 | A-18 produces dispute log and subscription movements | A-18 | Event set | Dispute + subscription tables | None |
| 6 | A-18 detects anomalies vs. defined thresholds | A-18 | Event set + thresholds | Anomaly list | None |
| 7 | If refund proposed: A-18 drafts proposal with policy reference and evidence | A-18 | Refund context | Refund proposal | None |
| 8 | A-18 produces consolidated finance summary | A-18 | All sections | Summary draft | None |
| 9 | Human reviews summary, anomalies, and any refund proposals | Human | Drafts | Approval / revision | **GATE** |
| 10 | If refund / credit / write-off approved: human executes in billing system | Human | Approved proposal | External execution | **ELEVATED GATE per item** |
| 11 | A-18 records the executed action in the daily summary post-fact | A-18 | Confirmation | Updated summary | Post-approval |

---

## Required Inputs

- Billing connector (read-only)
- Reference list of expected invoices in `/data/reference/finance/`
- Anomaly thresholds in `/data/reference/finance/thresholds.md`

---

## Outputs

- Finance summary: `/data/drafts/finance/[YYYY-MM-DD]-finance-summary.md`
- Dispute log: `/data/drafts/finance/[YYYY-MM-DD]-disputes.md`
- Refund proposal: `/data/drafts/finance/refund-proposals/[invoice-id]-[YYYY-MM-DD].md`
- Anomaly report: `/data/drafts/finance/[YYYY-MM-DD]-anomalies.md`
- Handoff: `/automation/handoffs/W-15-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|------------------|--------------|-----------------|-------|
| Step 9 | Summary, anomalies, refund proposals | Human operator | Any external action | GATE |
| Step 10 | Refund / credit / write-off per item | Human operator | Money movement | ELEVATED |

---

## Failure / Escalation

- Reconciliation mismatch above defined value threshold: flag `[URGENT — RECONCILIATION REVIEW]`
- Suspected fraud signal: flag `[URGENT — POTENTIAL FRAUD]`, escalate immediately
- Dispute approaching processor deadline: flag `[URGENT — DISPUTE DEADLINE]`

---

## Prompt File

[/automation/prompts/workflows/w-15-finance-reconciliation-prompt.md](../prompts/workflows/w-15-finance-reconciliation-prompt.md)
