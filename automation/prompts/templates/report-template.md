# Template: Operations and Business Report

**Usage:** Used by A-13 (Business Operations Summary Agent) and A-11 (Daily Briefing Agent) for all report outputs.

---

## Report Template

```
REPORT TYPE: [Operations Summary / Risk Report / Daily Briefing / Activity Log]
STATUS: [DRAFT — PENDING REVIEW]
PERIOD: [YYYY-MM-DD to YYYY-MM-DD] or [Daily: YYYY-MM-DD]
Date generated: [YYYY-MM-DD]
Agent: [Agent ID and Name]
Workflow: [Workflow ID]

---

## Summary

[3–5 sentence overview: what the report covers, top-line status, most critical item requiring attention]

---

## Operational Health Indicators

| Metric | Value |
|--------|-------|
| Active workflows | X |
| Pending approvals | X |
| Escalated items | X |
| Outputs produced this period | X |
| Overdue items | X |

---

## Priority Items (Action Required)

Listed by urgency:

### URGENT
1. [Item] — [context] — [recommended action] — [waiting since: date]

### NORMAL
1. [Item] — [context] — [recommended action]

### LOW
1. [Item]

---

## Workflow Status

| Workflow ID | Name | Status | Current Step | Blocked? | Notes |
|-------------|------|--------|--------------|----------|-------|
| W-XX | ... | in-progress / blocked / complete | Step X | Yes / No | ... |

---

## Risk and Blocker Flags

1. [Risk description] — [impact if unresolved] — [recommended action]

---

## Completed Outputs This Period

| Output | Workflow | Agent | Status |
|--------|----------|-------|--------|
| [file path] | W-XX | A-XX | draft / approved / exported |

---

## Traceability

Source: Compiled from `/automation/handoffs/`, `/data/reports/`, `/assets/briefings/`
Agent: [Agent ID]
Workflow: [Workflow ID]
Date: [YYYY-MM-DD]
Status: draft
Approved by: N/A
```

---

## Usage Notes

- All metrics in the health indicators section must use actual data — mark `[UNCERTAIN]` if data is unavailable
- The Priority Items section must be present even if empty (state "No urgent items at this time")
- Risk flags must include impact assessment — not just the risk itself
