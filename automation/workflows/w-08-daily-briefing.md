# Workflow W-08: Daily Operations Briefing

**ID:** W-08  
**Status:** Active  
**Primary Agent:** A-11 Daily Briefing and Operations Agent  
**Trigger:** Morning schedule trigger or human request

---

## Purpose

Compile and present a structured daily operational briefing to the human operator. Surface priorities, pending approvals, active workflows, schedule, and outstanding items. No system actions are triggered automatically from the briefing.

---

## Trigger Conditions

- Morning schedule trigger fires (T-03-01, when enabled)
- Human manually requests a briefing (T-01-07)
- System re-initialization after a pause

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | A-01 confirms data sources are available | A-01 | System state | Data availability check | None |
| 2 | Compile pending approvals section | A-11 | Handoff files | Approvals list | None |
| 3 | Compile active workflow status section | A-11 | Handoff files | Workflow status | None |
| 4 | Compile today's schedule | A-11 | A-10 schedule summary | Schedule section | None |
| 5 | Compile outstanding action items | A-11 | A-09 triage output | Action items section | None |
| 6 | Compile new inbox items | A-11 | `/data/inbox/` | Inbox items section | None |
| 7 | Compile escalations and flags | A-11 | All handoff files | Flags section | None |
| 8 | Compile carryover from previous briefing | A-11 | Previous briefing | Carryover section | None |
| 9 | Produce final briefing document | A-11 | All sections | Daily briefing | None |
| 10 | Human reads briefing and decides on actions | Human | Briefing | Human decisions | — |

---

## Required Inputs

- Workflow handoff files: `/automation/handoffs/`
- Email triage output (if available): `/data/drafts/email/[YYYY-MM-DD]-email-triage.md`
- Schedule summary (if available): `/data/drafts/calendar/[YYYY-MM-DD]-schedule-summary.md`
- Previous briefing: `/assets/briefings/[previous-date]-daily-briefing.md`
- Inbox contents: `/data/inbox/`

---

## Outputs

- Daily briefing: `/assets/briefings/[YYYY-MM-DD]-daily-briefing.md`
- Priority actions list: `/data/drafts/reports/[YYYY-MM-DD]-priority-actions.md`
- Handoff file: `/automation/handoffs/W-08-[YYYY-MM-DD].md`

---

## Approval Gates

None — briefing is auto-compiled. Human reads and acts on their own judgment. No system actions are triggered automatically from briefing content.

---

## Missing Data Handling

If a data source is unavailable (no email triage, no schedule summary):
- Produce the briefing with the available sections
- Flag the missing section explicitly: `[DATA NOT AVAILABLE — [reason]]`
- Do not silently omit sections

---

## Recurrence

Runs each configured working day. Previous briefings are retained in `/assets/briefings/`.

---

## Prompt File

[/automation/prompts/workflows/w-08-daily-briefing-prompt.md](../prompts/workflows/w-08-daily-briefing-prompt.md)
