# Workflow W-12: Report Generation and Approval Flow

**ID:** W-12  
**Status:** Active  
**Primary Agent:** A-13 Business Operations Summary Agent  
**Trigger:** Human requests a report or schedule trigger fires

---

## Purpose

Consolidate operational data, workflow statuses, and project progress into a structured report for managerial review. Produce risk flags and decision-ready summaries. Reports for external use require elevated approval before sharing.

---

## Trigger Conditions

- Human requests a report (T-01-06)
- Weekly report schedule trigger fires (T-03-03, when enabled)
- Monthly report schedule trigger fires (T-03-04, when enabled)
- Daily briefing surfaces need for a deeper operations summary

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Confirm reporting scope with human or trigger config | A-01 | Request or trigger | Scope definition | None |
| 2 | A-01 assigns report task to A-13 | A-01 | Scope + data sources | Task assignment | None |
| 3 | Compile workflow status summary | A-13 | Handoff files | Workflow section | None |
| 4 | Compile project progress section | A-13 | Reference data + handoffs | Project section | None |
| 5 | Compile pending decisions and approvals section | A-13 | Handoff files | Decisions section | None |
| 6 | Compile risk and blocker report | A-13 | All data | Risk section | None |
| 7 | Compile completed outputs summary | A-13 | Reports + exports | Outputs section | None |
| 8 | Compile operational health indicators | A-13 | All above | Indicators section | None |
| 9 | Produce combined report | A-13 | All sections | Full report draft | None |
| 10 | Human reviews draft report | Human | Report draft | Approval / revision | **GATE** |
| 11 | If for external use: elevated approval required | Human | Approved draft | **Elevated approval** | **ELEVATED GATE** |
| 12 | Approved report promoted to exports | A-01 / Human | Approved report | Export file | Post-approval |

---

## Required Inputs

- Workflow handoff files: `/automation/handoffs/`
- Data reports: `/data/reports/`
- Daily briefing outputs: `/assets/briefings/`
- Project reference data: `/data/reference/`
- Reporting period definition

---

## Report Types Supported

| Type | Contents |
|------|----------|
| Operations Summary | Workflow statuses, project progress, decisions pending |
| Risk Report | Blockers, escalations, overdue items, patterns |
| Activity Log | All outputs produced in period, by type and status |
| Full Report | All of the above combined |

---

## Outputs

- Operations summary: `/data/drafts/reports/[YYYY-MM-DD]-operations-summary.md`
- Risk report: `/data/drafts/reports/[YYYY-MM-DD]-risk-report.md`
- Activity log: `/data/drafts/reports/[YYYY-MM-DD]-activity-log.md`
- On approval: `/data/exports/reports/[YYYY-MM-DD]-[report-name].md`
- Handoff file: `/automation/handoffs/W-12-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|-----------------|--------------|-----------------|-------|
| Step 10 | Full report draft accuracy | Human operator | Report used or shared | GATE |
| Step 11 | External distribution approval | Human operator | Report shared externally | ELEVATED |

---

## Failure / Escalation

- Operational data insufficient for a reliable report: produce partial report with explicit `[UNCERTAIN]` flags
- Critical blocker or risk identified requiring immediate action: flag `[URGENT — HUMAN ACTION REQUIRED]` prominently
- Conflicting data sources: surface conflict, request human resolution

---

## Prompt File

[/automation/prompts/workflows/w-12-report-generation-prompt.md](../prompts/workflows/w-12-report-generation-prompt.md)
