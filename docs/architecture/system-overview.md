# System Overview

## AI-Assisted Business Operating System

**Repository:** Orchestrator_main  
**Version:** 1.0  
**Last Updated:** 2026-04-21

---

## 1. Purpose

This system is an orchestration-first AI operating environment designed to coordinate specialized agents, automate structured workflows, and support a human operator in running a business. It does not replace human judgment — it extends it, automates the repeatable, and ensures nothing important is missed.

The system spans the following operational domains:
- Business project operations
- Website extraction and content ingestion
- App differentiation from a base application
- Content and copy generation
- Asset and image planning
- Email management and drafting
- Calendar and scheduling support
- Daily operational briefings
- LinkedIn and business communications
- Business operations summaries
- Desktop and file organization
- Repository and system maintenance
- Integration planning

---

## 2. Architecture Layers

### Layer 1 — Orchestration Layer
The top-level coordination system. The **Master Orchestrator Agent** routes tasks, enforces governance, assigns responsibilities, manages approval gates, and maintains system coherence. Nothing runs outside this layer's awareness.

### Layer 2 — Agent Layer
Fourteen specialized agents, each with clearly defined scope, inputs, outputs, and escalation rules. Agents do not communicate directly with each other — they communicate through the orchestrator or via documented handoff files.

### Layer 3 — Workflow Layer
Documented step-by-step flows that define how work moves through the system. Each workflow names the responsible agent at each step, defines decision points, and specifies what must be human-approved.

### Layer 4 — Prompt Layer
Reusable, version-controlled prompt files that each agent and workflow phase uses. Prompts are stored in `/automation/prompts/` and are never ad-hoc — they are reviewed, categorized, and maintained.

### Layer 5 — Data and Output Layer
Structured storage for all inputs and outputs:
- `/data/inbox/` — incoming unprocessed material
- `/data/raw/` — source content before any processing
- `/data/extracted/` — machine-extracted structured data
- `/data/mapped/` — data mapped to app or content schemas
- `/data/normalized/` — cleaned and classified output
- `/data/drafts/` — drafts awaiting review or approval
- `/data/exports/` — approved, final outputs
- `/data/reports/` — system and operational reports
- `/data/reference/` — stable reference material

### Layer 6 — Governance Layer
Rules for approvals, safety boundaries, protected systems, and traceability. Defined in `/docs/governance/` and enforced by the Master Orchestrator Agent.

### Layer 7 — Integration Layer
Planning documentation for future connections to GitHub, email, calendar, local filesystem, VS Code, app pipelines, and cloud tools. No live integrations are implemented until formally approved.

---

## 3. Agent Map

| ID | Agent Name | Primary Domain |
|----|---|---|
| A-01 | Master Orchestrator Agent | Coordination, routing, governance |
| A-02 | Repository and System Agent | Repo structure, documentation, health |
| A-03 | Website Extraction Agent | Deep website content extraction |
| A-04 | Content Structuring Agent | Normalize and classify extracted content |
| A-05 | App Mapping Agent | Map content to app-ready schemas |
| A-06 | App Differentiation Agent | Derive differentiated app variants |
| A-07 | Asset and Image Planning Agent | Audit and plan visual assets |
| A-08 | Content Generation Agent | Produce copy, CTAs, FAQs, descriptions |
| A-09 | Email Triage and Drafting Agent | Classify email, detect follow-ups, draft replies |
| A-10 | Calendar and Scheduling Agent | Extract schedule data, detect conflicts |
| A-11 | Daily Briefing and Operations Agent | Compile daily priorities and summaries |
| A-12 | LinkedIn and Communication Agent | Social/business communication drafts |
| A-13 | Business Operations Summary Agent | Managerial reports and risk summaries |
| A-14 | Desktop and File Hygiene Agent | Local file classification and routing plan |
| A-15 | Integration Planning Agent | Plan and document future integrations |

Full agent definitions: [/docs/agents/agent-inventory.md](../agents/agent-inventory.md)  
Individual agent files: [/automation/agents/](../../automation/agents/)

---

## 4. Workflow Map

| ID | Workflow Name |
|----|---|
| W-01 | New Repository Initialization |
| W-02 | New Project or Client Intake |
| W-03 | New Website Ingestion |
| W-04 | Website Extraction to Structured Data |
| W-05 | Structured Data to App Mapping |
| W-06 | App Mapping to Differentiation Planning |
| W-07 | Differentiation Planning to Content/Asset Preparation |
| W-08 | Daily Operations Briefing |
| W-09 | Email to Calendar and Follow-up Flow |
| W-10 | Communication Draft Preparation |
| W-11 | Desktop and File Intake Review |
| W-12 | Report Generation and Approval Flow |

Full workflow definitions: [/docs/workflows/workflow-inventory.md](../workflows/workflow-inventory.md)

---

## 5. Data Flow Summary

```
External Input (website / email / file / calendar)
        ↓
   data/inbox/       ← raw incoming material
        ↓
   data/raw/         ← preserved source copy
        ↓
Agent Processing
        ↓
   data/extracted/   ← structured extraction output
        ↓
   data/mapped/      ← schema-mapped version
        ↓
   data/normalized/  ← cleaned, classified, reviewed
        ↓
   data/drafts/      ← output drafts awaiting approval
        ↓
Human Review / Approval Gate
        ↓
   data/exports/     ← approved, final outputs
        ↓
   data/reports/     ← archived reporting outputs
```

---

## 6. Governance Summary

| Category | Policy |
|---|---|
| Auto-run allowed | Non-destructive reads, extraction, classification, report drafts |
| Draft-only | All communication outputs (email, LinkedIn, calendar invites) |
| Approval required | Exports, app differentiation changes, integration activations |
| Never auto-destructive | File deletion, data overwrite, live sends, repository rewrites |
| Escalate when uncertain | Any ambiguous input, conflicting data, boundary-crossing task |

Full governance: [/docs/governance/automation-governance.md](../governance/automation-governance.md)

---

## 7. Operating Principles

1. **Documentation precedes execution** — no agent runs without a documented definition
2. **Prompts are assets** — all prompts are version-controlled and reusable
3. **Humans approve before sending** — draft mode is the default for all output
4. **Traceability is mandatory** — every output references its source
5. **Agents do not exceed scope** — cross-domain tasks route through the orchestrator
6. **Uncertainty triggers escalation** — not silence, not guessing
