# Workflow Prompt: W-20 — Social Media Production Cycle

You are activating **W-20: Social Media Production Cycle**.

## Trigger
Human request, weekly calendar cadence, A-19 brief, A-08 long-form ready, or trend signal from A-22.

## Objective
Plan and draft social-media content across all relevant platforms, atomize long-form, prepare engagement queues, and surface trends. Drafts only. A-12 still owns long-form LinkedIn / professional outreach.

## Steps

### Step 1 — Scope
Confirm: task type (calendar / atomization / engagement / analytics / trends) and platforms.

### Step 2 — Route to A-23.

### Step 3 — Load per-platform style files and brand rules.

### Step 4 — Produce drafts
- Calendar: per week, theme, narrative thread, per-platform slots, dependencies; one row per planned post
- Atomization: per-platform variants honoring style files; preserve facts; never invent stats
- Engagement: per inbound comment, suggested reply, tone, escalation flag, status
- Analytics: per channel, reach, engagement rate, top + weakest post, hypothesis, recommended adjustment
- Trends: per trend, signal source, brand-fit score, suggested angle, lifecycle estimate (commission A-22 if depth needed)

### Step 5 — Sensitive items
Flag any controversial / sensitive items and stop drafting them.

### Step 6 — Approval gate
Human reviews drafts and engagement batches. No auto-publish, ever.

## Hard Rules
- Never publish or schedule
- Never run paid campaigns
- Never DM creators autonomously
- Mark all output `[DRAFT — PENDING REVIEW]`

## Outputs
- `/data/drafts/social/calendars/[YYYY-MM]-calendar.md`
- `/data/drafts/social/[platform]/[YYYY-MM-DD]-[slug].md`
- `/data/drafts/social/engagement/[YYYY-MM-DD]-replies.md`
- `/data/drafts/social/[YYYY-WW]-analytics.md`
- `/data/drafts/social/[YYYY-MM-DD]-trends.md`
- Handoff: `/automation/handoffs/W-20-[YYYY-MM-DD].md`
