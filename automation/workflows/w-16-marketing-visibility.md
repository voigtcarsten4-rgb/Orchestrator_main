# Workflow W-16: Marketing Visibility Cycle

**ID:** W-16
**Status:** Active
**Primary Agent:** A-19 Marketing and SEO Agent
**Trigger:** Weekly cadence, mention spike, or human request

---

## Purpose

Monitor demand and visibility (rankings, content gaps, mentions, link engagement), and translate findings into content briefs that feed A-08 and signals that feed A-16 / A-22. Drafts only.

---

## Trigger Conditions

- T-01-13 — Human requests a marketing task
- T-03-10 — Weekly rankings schedule (when enabled)
- Material ranking change beyond defined threshold
- Mention with reputational risk

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Confirm task type (rankings / gaps / mentions / links / brief / scan) and scope | A-01 | Request | Scope definition | None |
| 2 | A-01 routes to A-19 | A-01 | Scope | Task assignment | None |
| 3 | A-19 pulls SEO and analytics data for the period (read-only) | A-19 | SEO connectors | Working set | None |
| 4 | A-19 produces requested artifacts (rankings / gaps / mentions / links) | A-19 | Working set | Drafts | None |
| 5 | A-19 detects flagged movements and reputational risks | A-19 | Working set | Flag list | None |
| 6 | If content brief requested: A-19 drafts brief and routes to A-08 | A-19 | Gap analysis | Content brief | None |
| 7 | If competitor scan: A-19 commissions A-22 for deeper context | A-19 | Competitor list | Research request | None |
| 8 | A-22 returns competitor profiles | A-22 | Topic | Profile files | None |
| 9 | A-19 consolidates final report | A-19 | All inputs | Report draft | None |
| 10 | Human reviews drafts | Human | Drafts | Approval / revision | **GATE** |
| 11 | Approved briefs activated as work for A-08 | A-08 | Approved brief | Content task | Post-approval |

---

## Required Inputs

- SEO data (rankings, keywords, backlinks)
- Web analytics (aggregate only)
- Brand-radar / mentions data
- Link analytics for shortened URLs
- Target keyword and competitor lists in `/data/reference/marketing/`

---

## Outputs

- Weekly rankings: `/data/drafts/marketing/[YYYY-WW]-rankings.md`
- Content gaps: `/data/drafts/marketing/[YYYY-MM-DD]-content-gaps.md`
- Mentions digest: `/data/drafts/marketing/[YYYY-MM-DD]-mentions.md`
- Link engagement: `/data/drafts/marketing/[YYYY-MM-DD]-links.md`
- Content briefs: `/data/drafts/marketing/briefs/[topic]-[YYYY-MM-DD].md`
- Handoff: `/automation/handoffs/W-16-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|------------------|--------------|-----------------|-------|
| Step 10 | Reports, briefs, flagged risks | Human operator | Brief activation, downstream content work | GATE |

---

## Failure / Escalation

- Sudden negative ranking shift suggesting penalty: flag `[URGENT — POSSIBLE PENALTY]`
- Reputational mention: escalate to A-12 + human immediately
- Anomalous link spike (potential fraud / attack): flag `[URGENT — TRAFFIC ANOMALY]`

---

## Prompt File

[/automation/prompts/workflows/w-16-marketing-visibility-prompt.md](../prompts/workflows/w-16-marketing-visibility-prompt.md)
