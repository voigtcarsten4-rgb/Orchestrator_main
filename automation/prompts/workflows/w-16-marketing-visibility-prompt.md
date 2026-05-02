# Workflow Prompt: W-16 — Marketing Visibility Cycle

You are activating **W-16: Marketing Visibility Cycle**.

## Trigger
Human request, weekly cadence, ranking shift beyond threshold, or reputational mention.

## Objective
Monitor demand and visibility (rankings, content gaps, mentions, link engagement) and translate findings into briefs for A-08 and signals for A-16 / A-22.

## Steps

### Step 1 — Scope
Confirm: task type (rankings / gaps / mentions / links / brief / scan) and period.

### Step 2 — Route to A-19.

### Step 3 — Pull data (read-only) from SEO and analytics connectors.

### Step 4 — Produce drafts
- Rankings: position changes per keyword, grouped by direction, threshold-flagged
- Content gaps: cluster gaps by topic, prioritize by effort × impact
- Mentions: text, source, sentiment, reach, recommended action
- Link engagement: per shortened link, clicks, geo, device, period delta

### Step 5 — Brief or scan
- Brief: audience, intent, primary + supporting keywords, target length, internal links, evidence
- Scan: competitor positioning shifts, content additions, pricing, hiring, releases (commission A-22 if depth needed)

### Step 6 — Approval gate
Human reviews drafts and flagged risks. Approved briefs activated as work in A-08.

## Hard Rules
- Never publish to live properties
- Never recommend a budget number — present demand evidence
- Cite every metric with source export / query
- Mark all output `[DRAFT — PENDING REVIEW]`

## Outputs
- `/data/drafts/marketing/[YYYY-WW]-rankings.md`
- `/data/drafts/marketing/[YYYY-MM-DD]-content-gaps.md`
- `/data/drafts/marketing/[YYYY-MM-DD]-mentions.md`
- `/data/drafts/marketing/[YYYY-MM-DD]-links.md`
- `/data/drafts/marketing/briefs/[topic]-[YYYY-MM-DD].md`
- Handoff: `/automation/handoffs/W-16-[YYYY-MM-DD].md`
