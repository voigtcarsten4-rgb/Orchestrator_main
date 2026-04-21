# Workflow Prompt: W-12 — Report Generation and Approval Flow

You are activating **W-12: Report Generation and Approval Flow**.

## Trigger
Human requests a business operations report, or weekly/monthly schedule trigger fires.

## Objective
Consolidate operational data into a structured report for managerial review. Produce risk flags and decision-ready summaries.

## Steps

### Step 1 — Scope Definition
Confirm with human (or from trigger configuration):
- Reporting period (daily / weekly / monthly / custom)
- Report type: operations summary / risk report / activity log / full report
- Any specific workflows or projects to focus on

### Step 2 — Route to A-13
A-01 assigns to Business Operations Summary Agent (A-13).

### Step 3 — Report Compilation
A-13 produces:
- Operations summary (workflow statuses, project progress)
- Risk and blocker report (flags, escalations, overdue items)
- Activity log summary (outputs delivered in period)
- Operational health indicators

All marked: `[DRAFT — PENDING REVIEW]`

### Step 4 — Human Review
Human reviews draft report.
Approves sections or requests revisions.
Decides which items require immediate action.

### Step 5 — Export Gate
For reports intended for external distribution:
**STOP — explicit human approval required before any report is shared externally.**

### Step 6 — Archive
Approved reports saved to `/data/exports/[project-id or reports]/`.
Draft reports remain in `/data/drafts/reports/`.

## Outputs
- `/data/drafts/reports/[YYYY-MM-DD]-operations-summary.md`
- `/data/drafts/reports/[YYYY-MM-DD]-risk-report.md`
- `/data/drafts/reports/[YYYY-MM-DD]-activity-log.md`
- On approval: `/data/exports/reports/[YYYY-MM-DD]-[report-name].md`
- Handoff file: `/automation/handoffs/W-12-[YYYY-MM-DD].md`
