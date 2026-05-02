# Workflow Prompt: W-21 — Personal Day Planning and Life Cycle

You are activating **W-21: Personal Day Planning and Life Cycle**.

## Trigger
Human request or daily personal-plan cadence.

## Objective
Keep the human's private life organized: day plan, travel, household, personal admin, learning. Strict privacy boundary: outputs stay under `/data/*/personal/`; never cross to business.

## Steps

### Step 1 — Scope
Confirm: task type (day plan / travel / household / admin / learning) and any inputs.

### Step 2 — Route to A-24 with personal-only context.

### Step 3 — Produce drafts
- Day plan: personal tasks + read-only business-calendar slots (abstract, no agenda detail). Time blocks, must-do, optional, what's at risk if skipped.
- Travel: itinerary per leg (dates, transport, accommodation, contacts, costs estimate, references), pre-trip checklist, conflict check with A-10.
- Household: refill list grouped by location, recurring chores due, suggested batch-shopping.
- Admin: renewals / subscriptions / appointments due in lookahead window, drafted reminder text.
- Learning: queue items, progress this week, suggested next session, blocked items.

### Step 4 — Approval gate
Human reviews. Travel bookings: human books, never A-24 (elevated per booking).

### Step 5 — Storage
Approved drafts remain under `/data/drafts/personal/` until human exports.

## Hard Rules
- Never share personal data with business agents
- Never write to non-personal folders
- Never book, send, pay, or contact anyone autonomously
- Never use business credentials for personal tasks
- Mark all output `[DRAFT — PENDING REVIEW]`

## Outputs
- `/data/drafts/personal/[YYYY-MM-DD]-day-plan.md`
- `/data/drafts/personal/travel/[trip-id]-itinerary.md`
- `/data/drafts/personal/household/[category]-[YYYY-MM-DD].md`
- `/data/drafts/personal/admin/[YYYY-MM-DD]-reminders.md`
- `/data/drafts/personal/learning/[YYYY-WW]-progress.md`
- Handoff (personal-only): `/automation/handoffs/personal/W-21-[YYYY-MM-DD].md`
