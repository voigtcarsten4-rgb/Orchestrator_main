# Agent Interaction Map

**Document:** `/automation/orchestrator/agent-interaction-map.md`
**Version:** 1.0
**Date:** 2026-04-21
**Owner:** Master Orchestrator Agent (A-01)

---

## 1. Core Principle

Agents do not interact directly with each other. All inter-agent communication flows through the Master Orchestrator Agent (A-01). The orchestrator reads each agent's output, validates it, and routes it to the next agent as input.

```
Agent A  →  [output to /data/]  →  A-01 Orchestrator  →  [input from /data/]  →  Agent B
```

---

## 2. Full Agent Interaction Map

### Primary Pipeline (W-02 through W-07)

```
Human Operator
    │
    ▼
A-01 Master Orchestrator (receives task, routes to W-02)
    │
    ▼
A-02 Repository and System Agent
    │  [confirms repo health, creates project record]
    ▼
A-01 (routes to A-03 if website project)
    │
    ▼
A-03 Website Extraction Agent
    │  [raw content → /data/raw/]
    ▼
A-01 (approval gate → routes to A-04)
    │
    ▼
A-04 Content Structuring Agent
    │  [structured data → /data/extracted/]
    ▼
A-01 (approval gate → routes to A-05)
    │
    ▼
A-05 App Mapping Agent
    │  [mapped schemas → /data/mapped/]
    ▼
A-01 (approval gate → routes to A-06)
    │
    ▼
A-06 App Differentiation Agent
    │  [differentiation plan → /data/normalized/]
    ▼
A-01 (elevated approval gate → routes to A-07 and A-08 in parallel)
    │                    │
    ▼                    ▼
A-07 Asset Planning    A-08 Content Generation
    │                    │
    └──────┬─────────────┘
           ▼
      /data/drafts/
           │
           ▼
    A-01 (approval gate → promotes to /data/exports/)
```

---

### Operations Pipeline (W-08, W-09, W-12)

```
Morning Trigger / Human Request
    │
    ▼
A-01 (routes to A-11)
    │
    ▼
A-11 Daily Briefing and Operations Agent
    │  [briefing → /assets/briefings/daily/]
    ▼
Human Operator reviews briefing

Email Batch Provided
    │
    ▼
A-01 (routes to A-09)
    │
    ▼
A-09 Email Triage and Drafting Agent
    │  [triage report + draft responses → /data/drafts/]
    │  [scheduling items → handoff for A-10]
    ▼
A-01 (routes scheduling items to A-10)
    │
    ▼
A-10 Calendar and Scheduling Agent
    │  [schedule analysis → /data/drafts/]
    ▼
Human Operator reviews and approves per item

Report Request
    │
    ▼
A-01 (routes to A-13)
    │
    ▼
A-13 Business Operations Summary Agent
    │  [report → /data/reports/]
    ▼
Human Operator reviews (elevated approval for external distribution)
```

---

### Communications Pipeline (W-10)

```
Communication Draft Request
    │
    ▼
A-01 (checks content source approval → routes to A-12)
    │
    ▼
A-12 LinkedIn and Communication Agent
    │  [draft → /data/drafts/]
    ▼
Human Operator approves before any use
```

---

### Analysis Pipelines (W-11, W-01)

```
File Listing Provided
    │
    ▼
A-01 (routes to A-14 — analysis-only mode)
    │
    ▼
A-14 Desktop and File Hygiene Agent
    │  [classification plan → /data/drafts/]
    ▼
Human Operator decides on each item

Repository Health Check
    │
    ▼
A-01 (routes to A-02)
    │
    ▼
A-02 Repository and System Agent
    │  [health report → /data/reports/]
    ▼
Human Operator reviews
```

---

## 3. Agent Output-to-Input Table

This table shows which agent's output feeds which agent's input:

| Source Agent | Output | Target Agent | Input Type |
|-------------|--------|-------------|------------|
| A-03 | Raw extracted website content | A-04 | Raw content for structuring |
| A-04 | Structured and normalized content | A-05 | Structured data for app mapping |
| A-05 | App-mapped content schema | A-06 | Mapped schema for differentiation |
| A-06 | Differentiation plan | A-07 | Content structure for asset planning |
| A-06 | Differentiation plan | A-08 | Approved context for content generation |
| A-07 | Asset plan | A-01 | For handoff record and approval gate |
| A-08 | Content drafts | A-01 | For handoff record and approval gate |
| A-09 | Email triage + scheduling items | A-10 | Scheduling data for calendar analysis |
| A-09 | Email triage + draft responses | A-01 | For approval gate |
| A-10 | Schedule analysis | A-11 | For daily briefing compilation |
| A-11 | Daily briefing | Human Operator | Direct review |
| A-12 | Communication drafts | Human Operator | Direct review and approval |
| A-13 | Operations reports | Human Operator | Direct review |
| A-14 | File hygiene analysis | Human Operator | Decision per item |
| A-15 | Integration documentation | Human Operator | Approval and activation decision |

---

## 4. Handoff Tracking

All handoffs between agents are recorded by the orchestrator in:

```
/automation/handoffs/[YYYY-MM-DD]-[workflow-id]-[step]-handoff.md
```

The orchestrator never routes an agent's output to the next agent without:
1. Confirming the output exists at the expected path
2. Confirming any required approval has been granted
3. Writing a handoff record for the transition

---

## 5. Protected Boundaries

The following interactions are permanently prohibited without elevated human approval:

| Action | Status |
|--------|--------|
| Any agent writing to `/data/raw/` | Blocked — raw data is immutable |
| Any agent writing to another agent's defined scope | Blocked — scope violation |
| Any agent triggering live integration | Blocked — documentation-only |
| Orchestrator approving its own routing decisions | Blocked — no self-approval |
| Any agent sending communication to external systems | Blocked — drafts only |
