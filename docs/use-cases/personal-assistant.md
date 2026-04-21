# Personal Assistant — Use Case Definitions

**Document:** `/docs/use-cases/personal-assistant.md`
**Version:** 1.0
**Date:** 2026-04-21
**Owner:** Human Operator
**System:** Orchestrator_main

---

## 1. Purpose

This document defines the personal assistant use cases supported by the Orchestrator_main system. Each use case describes what the system does, which agents are involved, what the operator does, and what the output looks like.

All outputs are drafts. The human operator reviews, approves, and acts.

---

## 2. Use Case Index

| ID | Use Case | Primary Agent(s) | Workflow |
|----|----------|-----------------|---------|
| PA-01 | Email triage and draft responses | A-09 | W-09 |
| PA-02 | Calendar management and conflict detection | A-10 | W-09 |
| PA-03 | Daily priority briefing | A-11 | W-08 |
| PA-04 | Social media content creation | A-08, A-12 | W-07, W-10 |
| PA-05 | Website content management | A-03, A-04, A-08 | W-03, W-04, W-07 |
| PA-06 | App content and operations (Wave Bite) | A-05, A-06, A-07, A-08 | W-05, W-06, W-07 |
| PA-07 | Business operations reporting (Wave Bite / Himmelreich) | A-13 | W-12 |
| PA-08 | Task planning and execution routing | A-01 | W-13 |

---

## 3. Use Case Details

---

### PA-01 — Email Triage and Draft Responses

**Scenario:** The operator receives a batch of emails and needs them classified and responded to efficiently.

**What the system does:**
- Classifies each email by type: action required, FYI, scheduling, client inquiry, vendor, personal
- Flags urgent items
- Drafts suggested responses for emails requiring a reply
- Identifies scheduling items and hands them off to A-10
- Produces a triage summary for quick operator review

**Operator's role:**
- Provides email batch to `/data/inbox/email/`
- Reviews the triage output
- Approves or edits draft responses before sending
- Sends emails manually — the system never sends

**Output:**
- `/data/drafts/[date]-email-triage.md` — triage summary and draft responses
- Handoff to A-10 for scheduling items

**Business context:** Applies to all email accounts — personal, Wave Bite, Himmelreich.

---

### PA-02 — Calendar Management and Conflict Detection

**Scenario:** The operator needs to understand scheduling conflicts, upcoming commitments, and calendar priorities.

**What the system does:**
- Parses scheduling data from emails or manual calendar input
- Detects conflicts and double-bookings
- Suggests priority ordering for overlapping events
- Prepares a structured schedule view for the coming days
- Flags unconfirmed meetings needing follow-up

**Operator's role:**
- Provides calendar data or email-derived scheduling items
- Reviews conflict analysis
- Makes all calendar decisions manually — the system does not write to calendar

**Output:**
- `/data/drafts/[date]-schedule-analysis.md` — structured schedule analysis and conflict flags

**Business context:** Used daily for personal schedule + Wave Bite and Himmelreich meetings.

---

### PA-03 — Daily Priority Briefing

**Scenario:** Each morning the operator needs a consolidated view of what matters most for the day.

**What the system does:**
- Compiles a structured daily briefing including:
  - Top priorities for the day
  - Pending approvals and their age
  - Emails flagged for action
  - Meetings and deadlines
  - Active project status summaries
  - Blocked tasks requiring operator input
  - Carryover items from the past 7 days

**Operator's role:**
- Requests briefing (or it is triggered automatically once scheduled trigger is enabled)
- Reviews briefing output
- Sets priorities based on briefing content

**Output:**
- `/assets/briefings/daily/[YYYY-MM-DD]-briefing.md`

**Business context:** Covers all active work — personal, Wave Bite, Himmelreich.

---

### PA-04 — Social Media and Content Creation

**Scenario:** The operator needs content for LinkedIn, Instagram, or the website — drafted and ready for review.

**What the system does:**
- Takes approved content source (structured data from app or website content)
- Generates platform-specific drafts:
  - LinkedIn posts (professional, business-oriented)
  - Instagram captions (visual-first, short, engaging)
  - Website copy updates (clear, conversion-focused)
- Ensures drafts are aligned with brand voice and project context
- All drafts require human approval before use

**Operator's role:**
- Provides content brief or approved source material
- Reviews all drafts
- Approves, edits, and publishes manually

**Output:**
- `/data/drafts/[project-id]-[platform]-content-[date].md`

**Business context:**
- **Wave Bite:** App launch content, food photography captions, restaurant partnerships
- **Himmelreich:** Event promotion, venue atmosphere content, booking CTAs

---

### PA-05 — Website Content Management

**Scenario:** The operator needs to keep website content current, structured, and ready for updates.

**What the system does:**
- Extracts current website content (via A-03)
- Structures and classifies extracted content (via A-04)
- Identifies gaps, outdated sections, or missing elements
- Generates updated or new copy for specific sections
- Produces a structured update plan for human review

**Operator's role:**
- Provides website URL(s) and approves extraction
- Reviews structured content
- Approves changes before they are applied to the live site

**Output:**
- `/data/extracted/[project-id]/` — extracted content
- `/data/drafts/[project-id]-website-update-plan.md` — proposed changes

**Business context:**
- **Wave Bite:** App landing page, ordering page, about section
- **Himmelreich:** Events, booking, gallery, contact

---

### PA-06 — App Content and Operations (Wave Bite)

**Scenario:** Wave Bite app needs structured content, screen definitions, and copy that are consistent and complete.

**What the system does:**
- Maps extracted and structured website content to app screen schemas (via A-05)
- Derives differentiated content for app-specific variants (via A-06)
- Plans required assets for each screen (via A-07)
- Generates app copy, CTAs, and FAQs (via A-08)

**Operator's role:**
- Approves each stage before proceeding
- Reviews all differentiation plans — this is an elevated approval step
- Makes final content decisions before any pipeline integration

**Output:**
- `/data/mapped/wave-bite/` — app-mapped content schemas
- `/data/normalized/wave-bite/` — differentiation plans
- `/data/drafts/wave-bite/` — content and asset drafts

**Business context:** Central to Wave Bite app build pipeline.

---

### PA-07 — Business Operations Reporting (Wave Bite / Himmelreich)

**Scenario:** The operator needs a consolidated view of business performance, tasks, and priorities across both projects.

**What the system does:**
- Compiles weekly or monthly operations summaries
- Aggregates: tasks completed, in progress, blocked; approvals outstanding; project milestones
- Identifies trends and highlights decision points
- Produces structured reports for operator review

**Operator's role:**
- Requests report (or scheduled trigger fires)
- Reviews and approves report
- Uses report for business planning decisions
- Approves elevated access for any external distribution

**Output:**
- `/data/reports/[date]-[type]-report.md`

**Business context:** Covers Wave Bite and Himmelreich operations.

---

### PA-08 — Personal Task Planning and Execution Routing

**Scenario:** The operator has a personal or business task that needs to be structured, classified, and routed to the right agent for execution.

**What the system does:**
- Receives task description from operator
- Classifies task by type, priority, and required agent
- Checks dependencies and prerequisites
- Routes task into the task system (`/data/tasks/`)
- Monitors task through to completion
- Produces execution output for operator review

**Operator's role:**
- Provides task description
- Reviews classification and routing before execution
- Approves outputs at each gate

**Output:**
- Task object in `/data/tasks/`
- Agent-produced output in appropriate `/data/` path
- Handoff records in `/automation/handoffs/`

**Business context:** Applies to all personal, Wave Bite, and Himmelreich tasks.

---

## 4. How to Trigger Any Use Case

To activate any personal assistant use case:

1. Provide the relevant input to the system (email batch, task description, URL, calendar data)
2. Ask the Master Orchestrator Agent (A-01) to route it
3. The orchestrator classifies, validates, and assigns to the correct agent
4. Review the draft output
5. Approve or provide feedback
6. Act on the result manually where required

---

## 5. What the System Never Does Automatically

| Action | Rule |
|--------|------|
| Send an email | Never — human sends |
| Post to social media | Never — human posts |
| Book or cancel a meeting | Never — human decides |
| Delete a file | Never — human confirms per file |
| Publish website content | Never — human publishes |
| Submit app updates | Never — human submits |
| Activate an integration | Never — requires elevated approval |
