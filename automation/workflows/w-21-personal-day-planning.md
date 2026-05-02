# Workflow W-21: Personal Day Planning and Life Cycle

**ID:** W-21
**Status:** Active — strict privacy boundary
**Primary Agent:** A-24 Personal Life and Household Agent
**Trigger:** Daily personal-plan cadence or human request

---

## Purpose

Keep the human's private life organized: daily plan, travel, household, personal admin, and learning queue. All outputs stay under `/data/*/personal/` and never cross into business agents or business folders.

---

## Trigger Conditions

- T-01-18 — Human requests a personal task
- T-03-15 — Daily personal day plan schedule (when enabled)
- Travel request input from human
- Recurring household / admin threshold reached

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Confirm task type (day plan / travel / household / admin / learning) and scope | A-01 | Request | Scope definition | None |
| 2 | A-01 routes to A-24 with personal-only context | A-01 | Scope | Task assignment | None |
| 3 | If day plan: A-24 reads personal task list and requests read-only business calendar from A-10 | A-24 | Personal tasks + A-10 read | Aggregated plan source | None |
| 4 | A-24 produces day plan with abstract business slots ("meeting 14:00–15:00" — no agenda detail) | A-24 | Plan source | Day plan draft | None |
| 5 | If travel: A-24 builds itinerary draft per leg with conflict-check via A-10 | A-24 | Travel input + calendar | Itinerary draft | None |
| 6 | If household: A-24 compares state vs. reference list and outputs refill list | A-24 | Reference list | Household list | None |
| 7 | If admin: A-24 surfaces upcoming renewals / appointments with drafted reminders | A-24 | Personal admin reference | Reminder list | None |
| 8 | If learning: A-24 produces queue progress digest and next-session suggestion | A-24 | Learning queue | Learning digest | None |
| 9 | Human reviews drafts | Human | Drafts | Approval / revision | **GATE** |
| 10 | If travel booking required: human books — A-24 never books | Human | Approved itinerary | External booking | **ELEVATED GATE per booking** |
| 11 | Approved updates remain under `/data/drafts/personal/` until human exports | Human | Approved drafts | Personal records | Post-approval |

---

## Required Inputs

- Personal task input (manual)
- Travel preferences and constraints
- Household reference list: `/data/reference/personal/household/`
- Personal calendar (read-only)
- Learning queue (manual)

---

## Outputs

- Day plan: `/data/drafts/personal/[YYYY-MM-DD]-day-plan.md`
- Travel itinerary: `/data/drafts/personal/travel/[trip-id]-itinerary.md`
- Household lists: `/data/drafts/personal/household/[category]-[YYYY-MM-DD].md`
- Admin reminders: `/data/drafts/personal/admin/[YYYY-MM-DD]-reminders.md`
- Learning progress: `/data/drafts/personal/learning/[YYYY-WW]-progress.md`
- Handoff (personal-only path): `/automation/handoffs/personal/W-21-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|------------------|--------------|-----------------|-------|
| Step 9 | Drafts | Human operator | Any external action | GATE |
| Step 10 | Travel booking per item | Human operator | Booking executed | ELEVATED |

---

## Privacy Rules (enforced throughout)

- All paths under `/data/*/personal/`; never written elsewhere
- Personal data never appears in A-11 / A-13 / A-16 reports
- Personal credentials never stored in this repo
- Human can purge `/data/*/personal/` at any time without breaking other workflows

---

## Failure / Escalation

- Personal admin past due with potential financial / legal impact: flag `[URGENT — PERSONAL ADMIN]`
- Travel itinerary conflicts business calendar: route conflict to A-10 + human
- Health-related reminder approaching critical date: flag `[URGENT — HEALTH ADMIN]`

---

## Prompt File

[/automation/prompts/workflows/w-21-personal-day-planning-prompt.md](../prompts/workflows/w-21-personal-day-planning-prompt.md)
