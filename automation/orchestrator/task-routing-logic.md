# Task Routing Logic

**Document:** `/automation/orchestrator/task-routing-logic.md`
**Version:** 1.0
**Date:** 2026-04-21
**Owner:** Master Orchestrator Agent (A-01)

---

## 1. How Task Routing Works

Every task that enters the system goes through a five-step routing process before any agent is activated.

### Step 1 — Input Classification

Determine the nature of the incoming task:

| Input Type | Description | Example |
|------------|-------------|---------|
| `instruction` | Direct human request | "Triage my emails" |
| `trigger_event` | Automated event | Morning schedule fires |
| `task_object` | Structured task from `/data/tasks/` | JSON task with type, priority, agent |
| `agent_completion` | Downstream step ready | A-09 has finished email triage |
| `escalation` | Agent has flagged uncertainty | A-04 reports low confidence on extraction |

### Step 2 — Domain Resolution

Map the classified input to the correct domain using `/config/routing.yaml`:

```
Input domain → Responsible agent → Required workflow (if applicable)
```

If domain is ambiguous: **escalate immediately, do not guess**.

### Step 3 — Prerequisite Check

Before assigning to an agent, verify:

- [ ] Required input data exists in the correct `/data/` path
- [ ] If part of a workflow, the previous step is marked complete
- [ ] No conflicting task is currently in progress for the same scope
- [ ] Input data quality is sufficient for the agent to proceed

If any check fails: block the task and request the missing input from the human operator.

### Step 4 — Governance Check

Apply rules from `/config/approvals.yaml`:

- Does this task require human approval before running?
- Is the approval already on record in the handoff file?
- Does this task involve a protected system (email send, file delete, live deploy)?

If approval is required and not yet received: pause, create approval request, notify human.

### Step 5 — Agent Assignment

Route the task to the assigned agent with:

- Task context (type, source, scope)
- Input file path(s)
- Expected output path
- Confidence threshold requirement
- Deadline or priority (if applicable)

Record the assignment in a handoff file at `/automation/handoffs/`.

---

## 2. Routing Decision Matrix

| Task Type | Agent | Workflow | Approval Required |
|-----------|-------|----------|------------------|
| New project intake | A-01 → A-02, A-13 | W-02 | Yes |
| Repository health check | A-02 | W-01 | No |
| Website ingestion | A-03 | W-03 | Yes — URL list approval |
| Content structuring | A-04 | W-04 | Yes — raw extraction approval |
| App schema mapping | A-05 | W-05 | Yes — structured content approval |
| App differentiation | A-06 | W-06 | Yes — elevated approval |
| Asset planning | A-07 | W-07 | Yes |
| Content generation | A-08 | W-07 | Yes |
| Email triage | A-09 | W-09 | No (triage) / Yes (draft send) |
| Calendar analysis | A-10 | W-09 | Yes — per action |
| Daily briefing | A-11 | W-08 | No (auto-compile) |
| Communication draft | A-12 | W-10 | Yes |
| Operations report | A-13 | W-12 | Yes — elevated for external |
| File hygiene analysis | A-14 | W-11 | Yes — per action |
| Integration planning | A-15 | — | Yes — elevated |
| Personal task execution | A-01 routes to appropriate agent | W-13 | Depends on task type |

---

## 3. Task Priority Levels

When processing tasks from `/data/tasks/`, the orchestrator respects the following priority order:

| Priority | Description | Action |
|----------|-------------|--------|
| `critical` | System or safety issue | Process immediately, escalate if blocked |
| `high` | Time-sensitive business action | Process before low/normal |
| `normal` | Standard operational task | Process in order received |
| `low` | Background or batch task | Process when no higher-priority work is pending |

---

## 4. Workflow Sequencing Rules

When a task is part of a defined workflow chain, the orchestrator enforces:

1. Steps must run in order — no skipping
2. Each step must complete and produce its output before the next step starts
3. Approval gates must be resolved before downstream steps are unlocked
4. Parallel steps (e.g., A-07 and A-08 in W-07) are assigned simultaneously but tracked independently

---

## 5. Escalation Routing

The orchestrator immediately escalates to the human operator when:

| Condition | What Happens |
|-----------|-------------|
| Task domain is ambiguous | Output: ESCALATION REQUIRED notice, workflow paused |
| Required input is missing | Output: missing input request, workflow blocked |
| Governance rule conflict | Output: conflict report, all related tasks paused |
| Agent returns low-confidence output | Output: quality flag, routed back to agent or escalated |
| Protected system targeted | Output: BLOCKED notice, no execution |
| Approval gate not resolved within 48 hours | Output: overdue approval alert |

---

## 6. Handoff File Structure

Every routing decision produces a handoff file at:

```
/automation/handoffs/[YYYY-MM-DD]-[workflow-id]-[step]-handoff.md
```

Handoff file contents:

```
Workflow ID:        [W-XX]
Step:               [step number and name]
Agent Assigned:     [A-XX agent name]
Input Path:         [/data/...]
Output Path:        [/data/...]
Status:             [pending | in-progress | complete | blocked | escalated]
Approval Required:  [yes | no]
Approval Status:    [pending | approved | rejected | not-required]
Timestamp:          [YYYY-MM-DDTHH:MM:SSZ]
Notes:              [any relevant context]
```
