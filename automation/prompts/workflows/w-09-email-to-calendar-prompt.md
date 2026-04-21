# Workflow Prompt: W-09 — Email to Calendar and Follow-up Flow

You are activating **W-09: Email to Calendar and Follow-up Flow**.

## Trigger
Human provides an email batch for processing, or scheduled email review trigger fires.

## Objective
Triage all emails, extract actions and scheduling data, produce reply drafts, and hand off calendar items for review.

## Steps

### Step 1 — Input Validation
Confirm email batch file exists: `/data/inbox/email/[YYYY-MM-DD]-email-batch.md`
Human confirms batch is ready for processing.

### Step 2 — Route to A-09
A-01 assigns to Email Triage and Drafting Agent (A-09).

### Step 3 — Triage Execution
A-09 produces:
- Email triage report (classification and priority for each email)
- Action items extracted
- Reply drafts for emails requiring response
- Scheduling handoff file for calendar-related emails

### Step 4 — Route Scheduling Data to A-10
A-01 routes the scheduling handoff to Calendar and Scheduling Agent (A-10).

### Step 5 — Calendar Processing (A-10)
A-10 produces:
- Calendar event drafts
- Conflict report
- Schedule summary
- Reminders

### Step 6 — Human Review
Human reviews:
- Email triage report and action items
- Reply drafts (approve before any email is sent)
- Calendar event drafts (approve before any calendar is updated)

### Step 7 — Gate: Human Approval Required for All Actions
**No email is sent. No calendar event is created. All output is draft until human approves and manually acts.**

## Outputs
- `/data/drafts/email/[YYYY-MM-DD]-email-triage.md`
- `/data/drafts/email/[YYYY-MM-DD]-reply-drafts.md`
- `/data/drafts/email/[YYYY-MM-DD]-action-items.md`
- `/data/drafts/calendar/[YYYY-MM-DD]-calendar-events.md`
- `/data/drafts/calendar/[YYYY-MM-DD]-schedule-summary.md`
- Handoff file: `/automation/handoffs/W-09-[YYYY-MM-DD].md`
