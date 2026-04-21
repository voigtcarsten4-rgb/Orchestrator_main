# Orchestrator Model

## Master Orchestrator Agent — Operating Model

---

## Purpose

The Master Orchestrator Agent is the coordination center of the entire system. It does not execute domain tasks itself. Its role is to:

- Receive task requests and classify them
- Assign tasks to the correct agent
- Enforce workflow sequencing
- Gate approvals and escalations
- Track the state of all active workflows
- Prevent unsafe or out-of-scope execution
- Ensure handoffs between agents are documented

---

## Orchestrator Responsibilities

| Responsibility | Description |
|---|---|
| Task routing | Map every incoming task to the correct agent and workflow |
| Workflow sequencing | Ensure steps run in order and prerequisites are met |
| Approval enforcement | Block execution at defined approval gates |
| Escalation handling | Route uncertain or boundary-crossing tasks to human review |
| State tracking | Maintain awareness of what is in progress, pending, or blocked |
| Handoff documentation | Ensure agent handoffs are recorded in `/automation/handoffs/` |
| Governance enforcement | Apply rules from `/docs/governance/` to all executions |
| Scope protection | Reject tasks that exceed any agent's documented scope |

---

## Non-Responsibilities of the Orchestrator

The orchestrator does **not**:

- Execute domain-specific work (extraction, drafting, mapping, etc.)
- Make business decisions
- Modify source data
- Send any communication
- Approve its own tasks
- Override governance rules

---

## Routing Logic

See detailed routing rules in: [routing-logic.md](routing-logic.md)

### High-Level Routing Principle

1. **Input arrives** (task request, trigger event, human instruction)
2. **Classify the input** — determine domain, agent, and workflow
3. **Check prerequisites** — are required inputs available? Are prior steps complete?
4. **Check governance** — does this task require approval before running?
5. **Assign to agent** — route with full context and expected output specification
6. **Monitor completion** — confirm output was stored correctly
7. **Trigger next step** — if part of a workflow, route to the next step
8. **Escalate if blocked** — if any step fails or is uncertain, escalate to human

---

## Approval Gates

The orchestrator enforces the following approval gates:

| Gate Type | Description |
|---|---|
| Pre-execution approval | Required before running any destructive or irreversible action |
| Output approval | Required before any draft is promoted to export |
| Integration approval | Required before any live integration is activated |
| Escalation approval | Required when agent signals uncertainty or boundary conflict |

Approval policy details: [/docs/governance/approval-model.md](../governance/approval-model.md)

---

## Escalation Conditions

The orchestrator escalates to human review when:

- An agent reports uncertainty about input quality or classification
- A task spans the boundary of multiple agent domains without clear primary ownership
- A governance rule is unclear or ambiguous in context
- An output from one step conflicts with an output from another step
- A trigger fires for a protected domain (email send, file delete, app deploy)
- Any integration action is requested that has not been formally approved

---

## State Tracking Model

The orchestrator tracks workflow state using handoff files stored in:

```
/automation/handoffs/
```

Each handoff file records:
- Workflow ID and step number
- Agent assigned
- Input file paths
- Output file paths
- Status (pending / in-progress / complete / blocked / escalated)
- Timestamp
- Human approval status (if required)

---

## Interaction Model

The orchestrator operates through:

1. **Prompt-driven execution** — using prompts from `/automation/prompts/orchestrator/`
2. **Workflow definitions** — following documented steps in `/automation/workflows/`
3. **Config files** — reading routing, trigger, and approval rules from `/config/`
4. **Handoff files** — recording state in `/automation/handoffs/`

---

## Constraints

- The orchestrator cannot unilaterally activate live integrations
- The orchestrator cannot approve its own outputs
- The orchestrator cannot modify governance files without human instruction
- The orchestrator must produce a handoff record for every task it routes
