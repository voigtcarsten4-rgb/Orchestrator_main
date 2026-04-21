# W-13 — Personal Task Execution

**Workflow ID:** W-13
**Document:** `/automation/workflows/personal_task_execution.md`
**Version:** 1.0
**Date:** 2026-04-21
**Primary Agent:** A-01 (Master Orchestrator — routing and sequencing)
**Status:** Active

---

## 1. Purpose

This workflow defines how personal and business tasks submitted by the human operator are received, classified, routed to the correct agent, executed, and returned as reviewed outputs.

It is the central entry point for day-to-day personal AI assistance — covering tasks across email, calendar, content, analysis, automation, reporting, and operations.

---

## 2. Workflow Overview

```
┌─────────────────────────────────────────────────────────┐
│  INPUT: Task submitted by human operator                │
│  (instruction, task object, trigger event)              │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 1 — CLASSIFICATION AGENT (A-01)                   │
│  Classify task by type, priority, and domain            │
│  Output: classified task object in /data/tasks/         │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 2 — ROUTING AGENT (A-01)                          │
│  Determine responsible agent and workflow (if any)      │
│  Validate prerequisites and governance rules            │
│  Output: routing decision + handoff record              │
└──────────────────────────┬──────────────────────────────┘
                           ↓
          ┌────────────────┴───────────────────┐
          ▼                                    ▼
  [Approval required?]                 [No approval needed]
          │                                    │
          ▼                                    ▼
  Pause — notify human               Proceed to Step 3
  Wait for approval
          │
          ▼
  Approval received → Step 3

┌─────────────────────────────────────────────────────────┐
│  STEP 3 — EXECUTION AGENT (assigned by A-01)            │
│  Agent executes the task within defined scope           │
│  Output: draft result stored in /data/drafts/           │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 4 — OUTPUT FORMATTING                             │
│  A-01 validates output completeness and format          │
│  Checks confidence threshold (≥ 0.9 to auto-proceed)   │
│  If below threshold → escalate to human                 │
└──────────────────────────┬──────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  OUTPUT: Formatted draft ready for human review         │
│  Stored in /data/drafts/                                │
│  Handoff record updated in /automation/handoffs/        │
└─────────────────────────────────────────────────────────┘
                           ↓
                  Human reviews output
                           ↓
          ┌────────────────┴───────────────────┐
          ▼                                    ▼
   [Approved]                          [Feedback provided]
          │                                    │
          ▼                                    ▼
  Promote to /data/exports/           Route back to agent
  or human acts on result             with feedback → Step 3
```

---

## 3. Step-by-Step Definitions

---

### Step 1 — Task Classification (A-01)

**Input:** Task submission from human operator (free text, structured task object, or trigger event)

**Actions:**
- Determine task type: email, calendar, content, analysis, automation, app, website, report, communication, file_hygiene, integration, system
- Assign priority: critical, high, normal, low
- Identify project association if applicable (Wave Bite, Himmelreich, personal)
- Check for dependencies (other tasks that must complete first)
- Create a task object conforming to the schema in `/data/tasks/tasks_schema.json`
- Store task object in `/data/tasks/`

**Output:** Task object at `/data/tasks/[task-id].json` with `status: queued`

**Escalation condition:** If task type cannot be determined with confidence, escalate to human before proceeding.

---

### Step 2 — Task Routing (A-01)

**Input:** Classified task object from Step 1

**Actions:**
- Look up responsible agent in `/config/routing.yaml` based on task type
- Determine if task belongs to an existing defined workflow (W-01 to W-12)
- Validate prerequisites:
  - Required input files exist at defined paths
  - Dependency tasks are complete
  - No conflicting task in progress
- Apply governance rules from `/config/approvals.yaml`:
  - Does this task type require pre-execution approval?
  - Is the approval already on record?
- If approval required and not yet received: pause task, create approval request, notify human
- Create handoff record at `/automation/handoffs/[date]-w13-[step]-handoff.md`
- Update task object `status` to `in_progress` or `awaiting_approval`

**Output:**
- Routing decision (agent assigned, input path, output path)
- Handoff record
- Task object updated

**Escalation condition:** If governance rule is ambiguous, or task crosses multiple agent domains without clear primary owner, escalate to human.

---

### Step 3 — Task Execution (Assigned Agent)

**Input:** Task context from orchestrator handoff — includes task object, input path, output path, expected format

**Agent scope:** Each agent executes only within its defined scope as documented in `/automation/agents/`.

**Actions (agent-specific):** Determined by the agent's definition file and prompt.

**Output:**
- Draft result stored in `/data/drafts/[task-id]-[output-type].md` or as specified in task object
- Confidence score included in output metadata
- Any blocking issues or escalation needs flagged in handoff file

**Escalation condition:** If agent confidence falls below 0.6, it must escalate rather than produce a low-confidence output.

---

### Step 4 — Output Formatting and Validation (A-01)

**Input:** Draft output from execution agent

**Actions:**
- Verify output exists at the expected path
- Verify output format matches the expected structure for this task type
- Check confidence score against threshold (≥ 0.9 to proceed automatically)
- If confidence is between 0.6 and 0.9: flag for human review before promoting
- If confidence is below 0.6: escalate — route back to agent with feedback
- Update task object `status` to `awaiting_approval` or `complete`
- Update handoff record with completion and output path

**Output:**
- Validated draft in `/data/drafts/`
- Updated handoff record
- Updated task object

---

## 4. Task Type to Agent Mapping

| Task Type | Responsible Agent | Notes |
|-----------|-----------------|-------|
| `email` | A-09 | Triage and draft responses |
| `calendar` | A-10 | Schedule analysis and conflict detection |
| `content` | A-08 | Copy, CTAs, FAQs, social content |
| `analysis` | A-04 or A-13 | Depends on analysis type |
| `automation` | A-01 routes | Automation planning only |
| `app` | A-05, A-06 | App mapping and differentiation |
| `website` | A-03, A-04 | Extraction and structuring |
| `report` | A-13 | Operations and business reports |
| `communication` | A-12 | LinkedIn and business communication drafts |
| `file_hygiene` | A-14 | Analysis only — no file operations |
| `integration` | A-15 | Documentation only |
| `system` | A-02 | Repository health and system maintenance |

---

## 5. Output Paths by Task Type

| Task Type | Draft Output Path | Export Path (after approval) |
|-----------|-----------------|------------------------------|
| `email` | `/data/drafts/[date]-email-[id].md` | Human acts directly |
| `calendar` | `/data/drafts/[date]-schedule-[id].md` | Human acts directly |
| `content` | `/data/drafts/[project-id]-content-[id].md` | `/data/exports/[project-id]/` |
| `report` | `/data/reports/[date]-[type]-report.md` | `/data/exports/` (if external) |
| `communication` | `/data/drafts/[project-id]-[platform]-[id].md` | Human acts directly |
| `website` | `/data/drafts/[project-id]-website-[id].md` | `/data/exports/[project-id]/` |
| `app` | `/data/drafts/[project-id]-app-[id].md` | `/data/exports/[project-id]/` |
| `file_hygiene` | `/data/drafts/[date]-hygiene-analysis.md` | Human acts directly |
| `system` | `/data/reports/[date]-health-report.md` | Human reviews |

---

## 6. Approval Gates

| Task Type | Approval Required | Level |
|-----------|-----------------|-------|
| `email` (triage) | No | — |
| `email` (draft send) | Yes | Standard |
| `content` (internal) | Yes | Standard |
| `content` (external publish) | Yes | Elevated |
| `app` (mapping) | Yes | Standard |
| `app` (differentiation) | Yes | Elevated |
| `website` (extraction) | Yes | Standard (URL approval) |
| `website` (publish) | Yes | Elevated |
| `communication` | Yes | Standard |
| `report` (internal) | Yes | Standard |
| `report` (external) | Yes | Elevated |
| `file_hygiene` | Yes | Per-item |
| `integration` | Yes | Elevated |

---

## 7. Escalation Conditions

| Condition | Response |
|-----------|---------|
| Task type cannot be classified | Escalate immediately — do not proceed |
| Required input file is missing | Block task — request input from human |
| Dependency task not complete | Queue task — wait for dependency |
| Agent confidence < 0.6 | Escalate — route back to agent with feedback or to human |
| Approval overdue > 48 hours | Notify human — flag as overdue |
| Task crosses multiple agent scopes ambiguously | Escalate — do not guess |

---

## 8. Related Documents

| Document | Path |
|----------|------|
| Task schema | `/data/tasks/tasks_schema.json` |
| Example tasks | `/data/tasks/example_tasks.json` |
| Task routing logic | `/automation/orchestrator/task-routing-logic.md` |
| Agent interaction map | `/automation/orchestrator/agent-interaction-map.md` |
| Master Orchestrator Agent | `/automation/agents/master-orchestrator.md` |
| Personal assistant use cases | `/docs/use-cases/personal-assistant.md` |
| Routing config | `/config/routing.yaml` |
| Approvals config | `/config/approvals.yaml` |
