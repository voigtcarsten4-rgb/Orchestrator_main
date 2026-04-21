# Daily Operations Model

## Daily Operating Rhythm and Process Definitions

---

## 1. Purpose

This document defines the daily operating rhythm of the AI-assisted business system. It describes what runs when, who reviews what, and how the human operator interacts with the system throughout a typical working day.

---

## 2. Daily Schedule Overview

| Time | Activity | Agent | Human Action Required |
|---|---|---|---|
| Morning start | Daily briefing compilation | A-11 Daily Briefing Agent | Review and prioritize |
| Morning start | Email batch triage | A-09 Email Triage Agent | Review drafts, approve sends |
| Morning | Calendar review | A-10 Calendar Agent | Confirm schedule, accept suggestions |
| During day | Task tracking updates | A-01 Orchestrator | Review open workflow states |
| During day | Website/content work | A-03, A-04, A-05 | Approve extractions and mappings |
| End of day | Operations summary | A-13 Business Ops Agent | Review and file |
| End of day | Briefing for tomorrow | A-11 Daily Briefing Agent | Optional review |

---

## 3. Morning Briefing Process

The Daily Briefing and Operations Agent (A-11) compiles a morning briefing by:

1. Collecting all open workflow states from `/automation/handoffs/`
2. Pulling all items in `/data/drafts/` awaiting approval
3. Summarizing calendar events for the day from provided calendar data
4. Listing overdue or blocked tasks
5. Highlighting any escalations or uncertainty flags
6. Summarizing pending follow-ups from email triage

**Output:** `/assets/briefings/daily/[YYYY-MM-DD]-morning-briefing.md`  
**Status:** Always draft — human reviews before acting

---

## 4. Daily Approval Queue

Each day, the human operator reviews the approval queue which may contain:

- Communication drafts awaiting send approval
- Data exports awaiting promotion approval
- Workflow outputs awaiting quality review
- Escalated items requiring human decision

The approval queue is surfaced in the morning briefing and tracked in handoff files.

---

## 5. Recurring Operational Tasks

| Frequency | Task | Owner |
|---|---|---|
| Daily | Morning briefing | A-11 |
| Daily | Email triage | A-09 |
| As needed | Website ingestion | A-03 |
| As needed | Content generation | A-08 |
| Weekly | Operations summary | A-13 |
| Weekly | Repository health check | A-02 |
| Monthly | Governance review | Human operator |
| Monthly | Integration planning review | A-15 |

---

## 6. Escalation Response Process

When an escalation is flagged in the morning briefing:

1. Human reads the escalation reason
2. Human provides clarification or decision
3. Orchestrator routes decision back to blocked agent
4. Agent resumes with clarification
5. Result is logged in handoff file

Escalations are never silently ignored. If unresolved, they carry forward to the next briefing.

---

## 7. End-of-Day Operations

The Business Operations Summary Agent (A-13) produces a daily operations summary:

- Open tasks and their status
- Completed outputs (with storage locations)
- Pending approvals not yet resolved
- Notable blockers or risks
- Recommended priorities for tomorrow

**Output:** `/data/reports/[YYYY-MM-DD]-daily-operations-summary.md`  
**Status:** Draft — human reviews

---

## 8. Weekly Rhythm

| Day | Focus |
|---|---|
| Monday | Review weekly priorities; new project intake if needed |
| Tuesday–Thursday | Active workflow execution (extraction, mapping, content, comms) |
| Friday | Operations summary; governance review if due; briefing preparation |
