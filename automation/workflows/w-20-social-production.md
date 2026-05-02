# Workflow W-20: Social Media Production Cycle

**ID:** W-20
**Status:** Active
**Primary Agent:** A-23 Social Media Agent
**Trigger:** Weekly calendar cadence, marketing brief from A-19, long-form content from A-08, trend signal from A-22, or human request

---

## Purpose

Plan and draft social-media content across all relevant platforms (LinkedIn, X, Instagram, TikTok, YouTube, Threads, Bluesky), atomize long-form into per-platform variants, and prepare engagement queues. Drafts only.

---

## Trigger Conditions

- T-01-17 — Human requests a social task
- T-03-14 — Weekly social calendar schedule (when enabled)
- T-04-08 — A-19 produces a content brief
- T-04-09 — A-08 produces approved long-form content

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Confirm task type (calendar / atomization / engagement / analytics / trends) and scope | A-01 | Request | Scope definition | None |
| 2 | A-01 routes to A-23 | A-01 | Scope | Task assignment | None |
| 3 | A-23 loads per-platform style files and brand rules | A-23 | `/data/reference/social/`, brand rules | Working set | None |
| 4 | If calendar: A-23 builds weekly plan honoring narrative threads from A-19 | A-23 | Briefs + theme | Calendar draft | None |
| 5 | If atomization: A-23 produces per-platform variants from source content | A-23 | Source content | Variant set | None |
| 6 | If engagement: A-23 batches inbound comments / mentions with suggested replies | A-23 | Mention feed | Engagement queue | None |
| 7 | If analytics: A-23 produces channel report with hypotheses for top / bottom posts | A-23 | Channel data | Analytics report | None |
| 8 | If trends: A-23 commissions A-22 for context, then drafts trend digest | A-23 | Trend signals | Trend digest | None |
| 9 | A-23 flags any controversial / sensitive items and stops drafting them | A-23 | Working set | Sensitive list | None |
| 10 | Human reviews drafts and engagement batches | Human | Drafts | Approval / revision | **GATE** |
| 11 | Approved posts queued for human-led publish (no auto-publish) | Human | Approved posts | Publish queue | Post-approval |

---

## Required Inputs

- Per-platform style files: `/data/reference/social/[platform].md`
- Brand rules from A-20
- Marketing briefs from A-19
- Long-form content from A-08 when atomizing
- Trend signals from A-22

---

## Outputs

- Calendar: `/data/drafts/social/calendars/[YYYY-MM]-calendar.md`
- Posts: `/data/drafts/social/[platform]/[YYYY-MM-DD]-[slug].md`
- Engagement queue: `/data/drafts/social/engagement/[YYYY-MM-DD]-replies.md`
- Analytics: `/data/drafts/social/[YYYY-WW]-analytics.md`
- Trends: `/data/drafts/social/[YYYY-MM-DD]-trends.md`
- Handoff: `/automation/handoffs/W-20-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|------------------|--------------|-----------------|-------|
| Step 10 | Drafts, engagement batches, sensitive list | Human operator | Any publish or reply | GATE |

---

## Failure / Escalation

- Sensitive / controversial trend: stop, escalate before drafting
- Crisis-comms signal in mentions: escalate to human + A-12 immediately
- Anomalous engagement spike: surface in next A-13 operations summary

---

## Prompt File

[/automation/prompts/workflows/w-20-social-production-prompt.md](../prompts/workflows/w-20-social-production-prompt.md)
