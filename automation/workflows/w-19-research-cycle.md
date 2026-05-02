# Workflow W-19: Research and Intelligence Cycle

**ID:** W-19
**Status:** Active
**Primary Agent:** A-22 Research and Intelligence Agent
**Trigger:** Strategy / Sales / Marketing / Social request, weekly signal scan, or human request

---

## Purpose

Run deep, source-cited research on topics, companies, markets, or technologies, and feed structured findings into A-16 / A-17 / A-19 / A-23. Every claim is anchored to a source.

---

## Trigger Conditions

- T-01-16 — Human requests research
- T-03-13 — Weekly signal scan schedule (when enabled)
- A-16 / A-17 / A-19 / A-23 commissions research

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Confirm topic, scope, horizon, quality bar, and downstream consumer | A-01 | Request | Scope definition | None |
| 2 | A-01 routes to A-22 | A-01 | Scope | Task assignment | None |
| 3 | A-22 writes a search plan: 3–7 specific questions + sources + stopping criterion | A-22 | Scope | Search plan | None |
| 4 | A-22 collects raw quotes with source URL and access date into evidence file | A-22 | Search plan | Evidence file | None |
| 5 | A-22 synthesizes findings with inline citations and confidence markers | A-22 | Evidence | Brief draft | None |
| 6 | A-22 produces competitor profiles or signal scans if requested | A-22 | Evidence | Profile / scan files | None |
| 7 | A-22 lists open questions and what would be needed to answer them | A-22 | Brief | Open-questions list | None |
| 8 | Human reviews brief and evidence | Human | Brief + evidence | Approval / revision | **GATE** |
| 9 | Approved brief routed to commissioning agent (A-16 / A-17 / A-19 / A-23) | Downstream agent | Approved brief | Downstream task | Post-approval |

---

## Required Inputs

- Topic and scope from commissioning agent or human
- Existing reference material in `/data/reference/`
- Approved web search and HF/paper search connectors

---

## Outputs

- Research brief: `/data/drafts/research/[YYYY-MM-DD]-[topic]-brief.md`
- Competitor profile: `/data/drafts/research/competitors/[competitor]-profile.md`
- Signal scan: `/data/drafts/research/[YYYY-MM-DD]-signals.md`
- Evidence file: `/data/drafts/research/evidence/[YYYY-MM-DD]-[topic].md`
- Handoff: `/automation/handoffs/W-19-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|------------------|--------------|-----------------|-------|
| Step 8 | Brief, evidence, confidence markers | Human operator | Downstream use | GATE |

---

## Failure / Escalation

- Source quality too low to support a claim: mark `[UNCERTAIN]` and surface gap; do not extrapolate
- Sources contradict materially: surface both, mark `[CONFLICT]`, request human resolution
- Topic touches privileged / legal-sensitive areas: stop, escalate to A-21 + human
- Paid source needed: stop, request pre-approval

---

## Prompt File

[/automation/prompts/workflows/w-19-research-cycle-prompt.md](../prompts/workflows/w-19-research-cycle-prompt.md)
