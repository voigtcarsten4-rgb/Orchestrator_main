# Automation Governance

## Rules for Safe, Traceable, and Auditable Automation

**Version:** 1.0  
**Owner:** Master Orchestrator Agent + Human Operator  
**Last Reviewed:** 2026-04-21

---

## 1. Governing Principle

**Automation extends human capability. It does not replace human judgment.**

Every rule in this document exists to ensure that automation runs only within boundaries the human operator has explicitly endorsed, and that every action is traceable, reversible where possible, and never silently destructive.

---

## 2. Automation Categories

### Category A — Auto-Run Allowed

These operations may run automatically without prior human approval:

| Operation | Conditions |
|---|---|
| Reading and indexing files | Read-only, no modification |
| Website content extraction | Source is publicly accessible |
| Content classification and normalization | Applied to extracted/raw data only |
| Report drafting | Output stored in `/data/drafts/`, never auto-published |
| Daily briefing compilation | Compiled from existing data sources, presented for review |
| Prompt selection and retrieval | Internal prompt lookup, no external action |
| Handoff file creation | State tracking only |
| Workflow status updates | Internal tracking only |

### Category B — Draft-Only Allowed

These operations may run but must produce draft outputs only. No draft may be promoted to final without human review:

| Operation | Draft Location |
|---|---|
| Email drafting | `/data/drafts/email/` |
| LinkedIn / communication drafting | `/data/drafts/communications/` |
| Calendar event preparation | `/data/drafts/calendar/` |
| App differentiation proposals | `/data/drafts/app/` |
| Content generation (copy, CTAs, FAQs) | `/data/drafts/content/` |
| Asset briefings | `/data/drafts/assets/` |
| Business operations summaries | `/data/drafts/reports/` |

### Category C — Approval Required Before Execution

These operations require explicit human approval before any execution begins:

| Operation | Reason |
|---|---|
| Promoting draft to export | Irreversible output |
| Activating any live integration | External system access |
| Modifying app differentiation structure | Affects downstream app |
| Overwriting any existing normalized data | Data integrity risk |
| Running any scheduled automation for the first time | Verify trigger safety |
| Modifying governance files | Rules must be human-controlled |
| Creating or modifying routing or trigger configurations | System behavior change |

### Category D — Never Auto-Destructive

These operations must **never** run automatically under any circumstances:

| Prohibited Auto-Action | Notes |
|---|---|
| Deleting any file | Always human-initiated |
| Sending any email | Always draft mode first |
| Posting to any platform | Always draft mode first |
| Modifying repository main branch | Protected branch |
| Overwriting raw or source data | Raw data is immutable reference |
| Triggering app build or deployment | Requires human-led release process |
| Invoking live API endpoints with write permissions | Approval required every time |

### Category E — Escalate When Uncertain

These conditions trigger automatic escalation to human review:

| Condition | Response |
|---|---|
| Input data quality is ambiguous or incomplete | Pause, flag, request clarification |
| Task domain spans multiple agents ambiguously | Route to orchestrator for assignment |
| Governance rule interpretation is unclear | Stop, log, escalate |
| Output confidence is below defined threshold | Mark as low-confidence, escalate |
| A protected system is in the task path | Block, log, notify human |
| Two data sources contradict each other | Flag both, request human resolution |
| Agent receives a task outside its scope | Return to orchestrator with reason |

---

## 3. Naming and File Placement Rules

### File Naming
- Use lowercase with hyphens: `project-intake-2026-04-21.md`
- Include date where temporal context matters: `YYYY-MM-DD-[type]-[subject].md`
- Include project or source ID in data files: `[project-id]-[content-type]-[version].md`
- No spaces in file or folder names
- No special characters except hyphens and underscores

### File Placement
- Raw inputs: `/data/raw/[project-id]/`
- Extracted data: `/data/extracted/[project-id]/`
- Mapped data: `/data/mapped/[project-id]/`
- Normalized data: `/data/normalized/[project-id]/`
- Drafts: `/data/drafts/[type]/[project-id]/`
- Approved exports: `/data/exports/[project-id]/`
- Reports: `/data/reports/`
- Briefings: `/assets/briefings/`
- Prompts: `/automation/prompts/[category]/`
- Agent definitions: `/automation/agents/`
- Workflow definitions: `/automation/workflows/`
- Handoffs: `/automation/handoffs/`

---

## 4. Traceability Requirements

Every output file must include at minimum:

```
Source: [file path or URL of input]
Agent: [agent ID and name]
Workflow: [workflow ID and step]
Date: [YYYY-MM-DD]
Status: [draft | approved | exported]
Approved by: [human name or N/A]
```

Report files additionally require:
- Summary of what data was used
- Confidence level of conclusions
- List of assumptions made
- Items flagged as uncertain

---

## 5. Uncertainty and Confidence Marking

All agent outputs must use these confidence markers where applicable:

| Marker | Meaning |
|---|---|
| `[CONFIRMED]` | Data verified from source, high confidence |
| `[INFERRED]` | Logical deduction from available data, not directly stated |
| `[UNCERTAIN]` | Low confidence, requires human review |
| `[MISSING]` | Expected data not found |
| `[CONFLICT]` | Two sources provide contradicting information |

---

## 6. Raw vs. Interpreted Data Separation

Raw extraction and interpretation must always be stored separately:

- `/data/raw/` — source material exactly as received, no modification
- `/data/extracted/` — structured extraction, close to source, minimal interpretation
- `/data/normalized/` — cleaned, classified, with interpretation clearly marked

Never merge raw and interpreted data in the same file. Never discard raw data after processing.

---

## 7. Agent Handoff Documentation

Every handoff between agents must be recorded in a handoff file. Handoff files must include:
- Source agent ID and name
- Target agent ID and name
- Workflow ID and step number
- Input file path(s)
- Expected output file path(s)
- Handoff timestamp
- Any conditions or notes for the receiving agent

---

## 8. Governance Review Schedule

These governance documents must be reviewed:

| Document | Review Frequency |
|---|---|
| This document | Monthly or after any significant incident |
| Approval model | Monthly |
| Trigger definitions | After any new automation is added |
| Agent definitions | After any scope change |
| Integration definitions | Before any integration is activated |
