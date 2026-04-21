# Orchestrator Overview

**Document:** `/automation/orchestrator/orchestrator-overview.md`
**Version:** 1.0
**Date:** 2026-04-21
**Owner:** Master Orchestrator Agent (A-01)

---

## 1. Purpose

This folder contains the operational layer of the Master Orchestrator Agent (A-01). It documents how the orchestrator manages task flow, routes work between agents, and maintains system coherence.

The orchestrator is the single coordination point. It does not execute domain work — it directs, sequences, gates, and tracks.

---

## 2. What the Orchestrator Does

```
┌──────────────────────────────────────────────────────────┐
│                    INCOMING TASK                         │
│  (human instruction / trigger / agent completion)       │
└──────────────────────────────┬───────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────┐
│               STEP 1 — CLASSIFY                         │
│  Determine domain, type, and required agent             │
└──────────────────────────────┬───────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────┐
│               STEP 2 — VALIDATE PREREQUISITES           │
│  Are required inputs present? Is the prior step done?   │
└──────────────────────────────┬───────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────┐
│               STEP 3 — GOVERNANCE CHECK                 │
│  Is human approval required before proceeding?          │
└──────────────────────────────┬───────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────┐
│               STEP 4 — ASSIGN TO AGENT                  │
│  Route task to correct agent with context and output    │
│  specification                                          │
└──────────────────────────────┬───────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────┐
│               STEP 5 — RECORD HANDOFF                   │
│  Write handoff record to /automation/handoffs/          │
└──────────────────────────────┬───────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────┐
│               STEP 6 — MONITOR AND SEQUENCE             │
│  Track completion, trigger next step if applicable      │
└──────────────────────────────┬───────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────┐
│               STEP 7 — ESCALATE IF BLOCKED              │
│  If any step is uncertain, incomplete, or violates      │
│  governance — escalate to human immediately             │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Orchestrator Scope

### What the Orchestrator Controls

| Action | Orchestrator Role |
|--------|-----------------|
| Task intake and classification | Primary |
| Agent assignment | Primary |
| Workflow sequencing | Primary |
| Approval gate enforcement | Primary |
| Handoff documentation | Primary |
| Escalation management | Primary |
| System-wide state tracking | Primary |

### What the Orchestrator Delegates

| Domain | Delegated To |
|--------|-------------|
| Website content extraction | A-03 |
| Content structuring and normalization | A-04 |
| App schema mapping | A-05 |
| App differentiation planning | A-06 |
| Asset and image planning | A-07 |
| Content copy generation | A-08 |
| Email triage and draft responses | A-09 |
| Calendar and scheduling analysis | A-10 |
| Daily briefing compilation | A-11 |
| Communication draft creation | A-12 |
| Business operations reporting | A-13 |
| Desktop and file hygiene analysis | A-14 |
| Integration planning documentation | A-15 |
| Repository health checks | A-02 |

---

## 4. Files in This Folder

| File | Purpose |
|------|---------|
| `orchestrator-overview.md` | This file — operational overview |
| `task-routing-logic.md` | How incoming tasks are classified and routed |
| `agent-interaction-map.md` | Visual and tabular map of agent interactions |

---

## 5. Related Files

| File | Purpose |
|------|---------|
| `/automation/agents/master-orchestrator.md` | Agent definition and scope |
| `/automation/prompts/orchestrator/master-orchestrator-prompt.md` | Execution prompt |
| `/docs/orchestration/orchestrator-model.md` | Conceptual model documentation |
| `/docs/orchestration/routing-logic.md` | Routing rules documentation |
| `/config/routing.yaml` | Machine-readable routing rules |
| `/config/approvals.yaml` | Approval gate policies |
| `/automation/handoffs/` | Active handoff records |

---

## 6. Operating Principles

1. **Draft first** — every output is a draft until explicitly approved by the human operator
2. **Route, don't execute** — the orchestrator coordinates work; agents do the work
3. **Gate before proceeding** — approval gates are not optional
4. **Escalate uncertainty** — when in doubt, stop and ask — never guess
5. **Trace everything** — every routing decision produces a handoff record
