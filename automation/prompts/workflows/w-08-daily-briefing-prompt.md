# Workflow Prompt: W-08 — Daily Operations Briefing

You are activating **W-08: Daily Operations Briefing**.

## Trigger
Morning schedule trigger fires on each configured working day, or human manually requests a briefing.

## Objective
Compile and deliver a structured daily operational briefing covering priorities, schedule, pending approvals, active workflows, and outstanding items.

## Steps

### Step 1 — Pre-Briefing Data Collection
A-01 confirms the following data sources are available:
- Latest email triage output (from A-09, if email was processed)
- Latest schedule summary (from A-10)
- Current workflow handoff files (from `/automation/handoffs/`)
- Previous day's briefing (from `/assets/briefings/`)
- Inbox contents (from `/data/inbox/`)

### Step 2 — Route to A-11
A-01 assigns to Daily Briefing and Operations Agent (A-11).

### Step 3 — Briefing Compilation
A-11 compiles the briefing with sections:
1. Pending approvals (by urgency)
2. Active workflows and their states
3. Today's schedule
4. Outstanding action items (from email triage)
5. New inbox items
6. Escalations and flags
7. Carryover from yesterday

### Step 4 — Briefing Output
A-11 saves briefing to `/assets/briefings/[YYYY-MM-DD]-daily-briefing.md`.
Marked: `[DRAFT — FOR REVIEW]`

### Step 5 — Human Reads and Acts
Human reviews the briefing and decides which items to action.
No system actions are triggered automatically from briefing content.

## Outputs
- `/assets/briefings/[YYYY-MM-DD]-daily-briefing.md`
- `/data/drafts/reports/[YYYY-MM-DD]-priority-actions.md`
- Handoff file: `/automation/handoffs/W-08-[YYYY-MM-DD].md`

## Recurrence
Runs each configured working day. Previous briefings are archived in place.
