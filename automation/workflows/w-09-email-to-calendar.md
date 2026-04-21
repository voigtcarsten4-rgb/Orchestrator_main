# Workflow W-09: Email to Calendar and Follow-up Flow

**ID:** W-09  
**Status:** Active  
**Primary Agents:** A-09 Email Triage and Drafting Agent → A-10 Calendar and Scheduling Agent  
**Trigger:** Human provides email batch or scheduled email review trigger

---

## Purpose

Process an email batch: classify, prioritise, extract action items and scheduling data, draft replies, and produce structured calendar event drafts. All outputs are drafts. No email is sent and no calendar entry is created without human approval.

---

## Trigger Conditions

- Human provides an email batch (T-01-03)
- Scheduled email review trigger fires (T-03-05, when enabled and integration approved)

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Human provides email batch file | Human | Email batch | File in `/data/inbox/email/` | **Input required** |
| 2 | A-01 assigns triage task to A-09 | A-01 | Batch file path | Task assignment | None |
| 3 | Email classification and prioritisation | A-09 | Email batch | Triage report | None |
| 4 | Action item extraction | A-09 | Email batch | Action items list | None |
| 5 | Reply draft generation | A-09 | Email batch | Reply drafts | None |
| 6 | Scheduling data extraction and handoff to A-10 | A-09 | Calendar-related emails | Scheduling handoff file | None |
| 7 | A-01 routes scheduling handoff to A-10 | A-01 | Scheduling handoff | Task assignment to A-10 | None |
| 8 | Calendar event draft production | A-10 | Scheduling handoff | Event drafts | None |
| 9 | Conflict detection and schedule summary | A-10 | Event drafts | Conflict report + summary | None |
| 10 | Human reviews triage report, reply drafts, and calendar drafts | Human | All outputs | Decisions on each item | **GATE — individual approval per action** |

---

## Required Inputs

- Email batch: `/data/inbox/email/[YYYY-MM-DD]-email-batch.md`
- Contact reference list (optional): `/data/reference/`
- Project context (if emails relate to active projects)

---

## Outputs

- Triage report: `/data/drafts/email/[YYYY-MM-DD]-email-triage.md`
- Reply drafts: `/data/drafts/email/[YYYY-MM-DD]-reply-drafts.md`
- Action items: `/data/drafts/email/[YYYY-MM-DD]-action-items.md`
- Calendar event drafts: `/data/drafts/calendar/[YYYY-MM-DD]-calendar-events.md`
- Conflict report: `/data/drafts/calendar/[YYYY-MM-DD]-conflict-report.md`
- Schedule summary: `/data/drafts/calendar/[YYYY-MM-DD]-schedule-summary.md`
- Handoff file: `/automation/handoffs/W-09-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before |
|------|-----------------|--------------|-----------------|
| Step 10 — per reply draft | Each reply email | Human operator | Any email is sent |
| Step 10 — per calendar event | Each calendar event | Human operator | Any calendar entry is created |

Note: **No batch approval.** Every email reply and every calendar action requires individual human approval.

---

## Safety Rules

- No email is sent by any agent at any point
- No calendar entry is created by any agent at any point
- Drafts marked `[DRAFT — NOT SENT]` and `[DRAFT — PENDING CONFIRMATION]` at all times
- Sensitive or legal email content flagged immediately: `[SENSITIVE — HUMAN REVIEW REQUIRED]`

---

## Failure / Escalation

- Email appears to be phishing or social engineering: flag immediately, halt processing of that email
- Legal or financial content: flag `[SENSITIVE]`, escalate to human, do not draft a reply automatically
- Reply requires a business commitment: mark `[REQUIRES HUMAN DECISION]` in the draft

---

## Prompt File

[/automation/prompts/workflows/w-09-email-to-calendar-prompt.md](../prompts/workflows/w-09-email-to-calendar-prompt.md)
