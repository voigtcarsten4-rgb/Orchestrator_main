# Workflow W-14: Sales Pipeline Cycle

**ID:** W-14
**Status:** Active
**Primary Agent:** A-17 Sales and CRM Agent
**Trigger:** Human request, weekly hygiene cadence, or new lead arrival

---

## Purpose

Keep the sales pipeline clean, qualified, and moving by combining lead scoring, hygiene scanning, account research, and follow-up drafting into one repeatable cycle. All outbound is draft.

---

## Trigger Conditions

- T-01-11 — Human requests a sales task
- T-03-08 — Weekly pipeline hygiene schedule (when enabled)
- T-04-07 — A-22 returns account research for an open A-17 task

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Confirm task type (score / hygiene / follow-up / briefing) and scope | A-01 | Request | Scope definition | None |
| 2 | A-01 routes to A-17 | A-01 | Scope | Task assignment | None |
| 3 | A-17 reads CRM scope (read-only) | A-17 | CRM connector | Working set | None |
| 4 | If account research needed, A-17 commissions A-22 | A-17 | Account list | Research request | None |
| 5 | A-22 returns account profiles | A-22 | Topic | Profile files | None |
| 6 | A-17 produces requested artifacts (scores, hygiene report, drafts, briefings) | A-17 | Inputs | Drafts | None |
| 7 | A-17 marks deals at risk and surfaces required CRM writes (does not apply them) | A-17 | Working set | Risk + write-request list | None |
| 8 | Human reviews drafts and risk list | Human | Drafts | Approval / revision | **GATE** |
| 9 | If outbound: human approves per message or per batch | Human | Approved drafts | Send authorization | **GATE** |
| 10 | Approved outbound routed to A-09 (email) or A-12 (LinkedIn) for human-led send | A-09 / A-12 | Approved messages | Outbound packet | Post-approval |
| 11 | Approved CRM writes applied by human | Human | Write-request list | CRM update | Post-approval |

---

## Required Inputs

- CRM read-only connector
- Documented ICP and scoring rubric in `/data/reference/sales/`
- A-22 research outputs (when needed)
- Engagement signals (open rates, replies) when available

---

## Outputs

- Lead scoring report: `/data/drafts/sales/[YYYY-MM-DD]-lead-scores.md`
- Pipeline hygiene report: `/data/drafts/sales/[YYYY-MM-DD]-pipeline-hygiene.md`
- Follow-up drafts: `/data/drafts/sales/follow-ups/[deal-id]-[YYYY-MM-DD].md`
- Account briefings: `/data/drafts/sales/briefings/[account-id].md`
- Handoff: `/automation/handoffs/W-14-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|------------------|--------------|-----------------|-------|
| Step 8 | Drafts and pipeline-risk list | Human operator | Any further action | GATE |
| Step 9 | Outbound message text per item or batch | Human operator | Send by A-09 / A-12 | GATE |

---

## Failure / Escalation

- ICP rubric ambiguous on a lead: flag `[UNCERTAIN]`, request human classification
- Large enterprise account or compliance-sensitive contact (DNC list, regulated industry): escalate before any drafting
- Pipeline anomaly (e.g., > N% deals stalled): surface in next A-13 operations summary

---

## Prompt File

[/automation/prompts/workflows/w-14-sales-pipeline-cycle-prompt.md](../prompts/workflows/w-14-sales-pipeline-cycle-prompt.md)
