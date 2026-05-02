# Workflow W-13: Strategy Briefing and OKR Drafting

**ID:** W-13
**Status:** Active
**Primary Agent:** A-16 CEO and Strategy Agent
**Trigger:** Human requests strategy view, quarterly cadence (T-03-07), or material report from A-13/A-17/A-18/A-19/A-22 (T-04-12, disabled by default)

---

## Purpose

Produce forward-looking strategic artifacts (briefings, OKRs, decision memos, foresight scans) anchored in current operational and research evidence. Drafts only; the human commits.

---

## Trigger Conditions

- T-01-10 — Human requests a strategy view
- T-03-06 — Weekly strategy briefing schedule (when enabled)
- T-03-07 — Quarterly OKR draft schedule (when enabled)
- T-04-06 — A-22 evidence ready for an open A-16 task
- T-04-12 — Material report from a source agent (disabled by default)

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Confirm horizon, scope, and target artifact (briefing / OKR / memo / foresight) | A-01 | Request or trigger config | Scope definition | None |
| 2 | A-01 routes to A-16 | A-01 | Scope | Task assignment | None |
| 3 | A-16 commissions evidence from A-22 if not already available | A-16 | Scope | Research request | None |
| 4 | A-22 returns evidence file with cited sources | A-22 | Topic | Evidence file | None |
| 5 | A-16 collects current state from A-13, A-17, A-18, A-19 | A-16 | Source paths | Aggregated inputs | None |
| 6 | A-16 drafts the requested artifact | A-16 | Inputs + evidence | Draft artifact | None |
| 7 | A-16 lists explicit decisions the human must make | A-16 | Draft | Decision asks | None |
| 8 | Human reviews draft + decision asks | Human | Draft | Approval / revision | **GATE** |
| 9 | If artifact is for external distribution: elevated approval | Human | Approved draft | Elevated approval | **ELEVATED GATE** |
| 10 | Approved artifact stored under exports | A-01 / Human | Approved artifact | Export file | Post-approval |

---

## Required Inputs

- A-13 reports under `/data/drafts/reports/`
- A-22 evidence under `/data/drafts/research/evidence/`
- A-17, A-18, A-19 outputs under their respective draft folders
- Human-defined horizon and target artifact

---

## Outputs

- Strategy briefing: `/data/drafts/strategy/[YYYY-MM-DD]-strategy-briefing.md`
- OKR draft: `/data/drafts/strategy/[YYYY-Qn]-okrs.md`
- Decision memo: `/data/drafts/strategy/[YYYY-MM-DD]-decision-memo-[topic].md`
- Foresight scan: `/data/drafts/strategy/[YYYY-MM-DD]-foresight.md`
- On approval: `/data/exports/strategy/[YYYY-MM-DD]-[artifact].md`
- Handoff: `/automation/handoffs/W-13-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|------------------|--------------|-----------------|-------|
| Step 8 | Draft accuracy and reasoning | Human operator | Artifact used | GATE |
| Step 9 | External distribution | Human operator | Shared externally | ELEVATED |

---

## Failure / Escalation

- Evidence insufficient: produce partial draft with `[UNCERTAIN]` flags and explicit gaps
- Sources contradict materially: surface conflict, ask human to resolve
- Decision involves irreversible commitment: flag `[IRREVERSIBLE — HUMAN DECISION REQUIRED]`

---

## Prompt File

[/automation/prompts/workflows/w-13-strategy-briefing-prompt.md](../prompts/workflows/w-13-strategy-briefing-prompt.md)
