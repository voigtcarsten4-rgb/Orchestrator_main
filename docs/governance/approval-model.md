# Approval Model

## Human Approval Requirements and Process

**Version:** 1.0  
**Owner:** Human Operator  
**Last Reviewed:** 2026-04-21

---

## 1. Approval Philosophy

Approval requirements exist to ensure that no consequential, irreversible, or externally-facing action occurs without human awareness and consent. The system assumes the human operator is the final authority on all outputs and integrations.

---

## 2. Approval Requirement Matrix

### By Output Type

| Output Type | Requires Approval? | When |
|---|---|---|
| Internal draft (any type) | No | Drafts can be created freely |
| Promoted export | **Yes** | Before moving from `/data/drafts/` to `/data/exports/` |
| Published communication | **Yes** | Before any send, post, or publish action |
| Calendar write | **Yes** | Before any calendar modification |
| File deletion | **Yes** | Every time, no exceptions |
| App differentiation change | **Yes** | Before applying to base app |
| Integration activation | **Yes** | Before any live integration runs |
| Governance rule change | **Yes** | Human must modify governance files directly |
| Repository main branch change | **Yes** | Protected, requires pull request review |

### By Action Type

| Action | Approval Level |
|---|---|
| Read-only data operation | None |
| Draft creation | None |
| Draft review request | None — but human must review before next step |
| Draft promotion to export | Required |
| External communication send | Required + draft review |
| File modification | Required if existing file; none for new files in working dirs |
| File deletion | Always required |
| Live integration call | Required |
| Scheduled automation activation | Required on first run |
| Agent scope change | Required |
| Governance file modification | Required |

---

## 3. Approval Workflow

When an approval is required, the system follows this process:

```
1. Agent completes draft or reaches approval gate
2. Orchestrator records approval request in handoff file
3. Orchestrator notifies human (via briefing or direct flag)
4. Human reviews output or proposed action
5. Human approves or rejects with optional comment
6. Orchestrator records decision and timestamp
7. If approved: workflow continues
8. If rejected: orchestrator routes feedback to originating agent for revision
```

---

## 4. Approval Record Format

Every approval must be recorded in the relevant handoff file or report:

```markdown
## Approval Record

- Item: [description of what is being approved]
- Workflow: [workflow ID and step]
- Agent: [agent ID that produced the output]
- Date requested: [YYYY-MM-DD]
- Date decided: [YYYY-MM-DD]
- Decision: [APPROVED / REJECTED / DEFERRED]
- Decided by: [human name]
- Comment: [optional notes]
```

---

## 5. Protected Areas — No Approval Bypass

The following can never be approved automatically or by the orchestrator itself:

| Protected Area | Reason |
|---|---|
| Live email send | Irreversible external communication |
| Social media post | Irreversible public content |
| File deletion | Permanent data loss |
| Repository main branch push | Code governance |
| Integration activation | External system access |
| App build/deploy | Production system change |
| Governance file modification | System rules must stay human-controlled |

---

## 6. Approval Delegation

At this time, **no approval delegation is configured**. All approvals require the primary human operator. Future delegation rules may be added here when a team context requires it.

---

## 7. Rejection Handling

When an approval is rejected:

1. The orchestrator routes the rejection back to the originating agent
2. The agent revises the output based on the rejection comment
3. A new draft version is created (do not overwrite the original)
4. The revised draft is flagged for re-review
5. Maximum revision cycles: **3** before human escalation for direct intervention

---

## 8. Escalation to Human

Beyond approval, escalation is required when:

- An agent cannot complete a revision after 3 cycles
- Input data quality is too low to produce reliable output
- A task falls outside all defined agent scopes
- A governance rule and a user instruction conflict
- A data conflict cannot be resolved by the agent

Escalation does not mean failure. It means the system is working correctly by knowing its limits.
