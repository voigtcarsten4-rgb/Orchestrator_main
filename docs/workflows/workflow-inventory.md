# Workflow Inventory

## All Defined Workflows — Master Reference

---

## Summary Table

| ID | Workflow Name | Trigger | Primary Agent | Definition File |
|----|---|---|---|---|
| W-01 | New Repository Initialization | Repository created | A-02 | [w-01-repository-initialization.md](../../automation/workflows/w-01-repository-initialization.md) |
| W-02 | New Project or Client Intake | Human initiates new project | A-01 | [w-02-project-intake.md](../../automation/workflows/w-02-project-intake.md) |
| W-03 | New Website Ingestion | Website URL provided | A-03 | [w-03-website-ingestion.md](../../automation/workflows/w-03-website-ingestion.md) |
| W-04 | Website Extraction to Structured Data | A-03 output ready | A-04 | [w-04-extraction-to-structured.md](../../automation/workflows/w-04-extraction-to-structured.md) |
| W-05 | Structured Data to App Mapping | A-04 output ready | A-05 | [w-05-structured-to-app-mapping.md](../../automation/workflows/w-05-structured-to-app-mapping.md) |
| W-06 | App Mapping to Differentiation Planning | A-05 output approved | A-06 | [w-06-mapping-to-differentiation.md](../../automation/workflows/w-06-mapping-to-differentiation.md) |
| W-07 | Differentiation to Content/Asset Prep | A-06 output approved | A-07 + A-08 | [w-07-differentiation-to-content.md](../../automation/workflows/w-07-differentiation-to-content.md) |
| W-08 | Daily Operations Briefing | Morning schedule trigger | A-11 | [w-08-daily-briefing.md](../../automation/workflows/w-08-daily-briefing.md) |
| W-09 | Email to Calendar and Follow-up | Email batch provided | A-09 | [w-09-email-to-calendar.md](../../automation/workflows/w-09-email-to-calendar.md) |
| W-10 | Communication Draft Preparation | Draft request received | A-12 | [w-10-communication-draft.md](../../automation/workflows/w-10-communication-draft.md) |
| W-11 | Desktop and File Intake Review | File review triggered | A-14 | [w-11-desktop-file-review.md](../../automation/workflows/w-11-desktop-file-review.md) |
| W-12 | Report Generation and Approval | Report requested | A-13 | [w-12-report-generation.md](../../automation/workflows/w-12-report-generation.md) |

---

## Workflow Design Rules

Every workflow in this system must:

1. Have a documented trigger condition
2. Name the responsible agent at every step
3. Identify every decision point explicitly
4. Mark every approval gate clearly
5. Specify exactly where outputs are stored
6. Define retry and failure behavior
7. Distinguish what is automated from what remains manual

---

## Workflow State Model

Each active workflow instance uses a handoff file in `/automation/handoffs/`:

```
/automation/handoffs/[W-ID]-[YYYY-MM-DD]-[instance].md
```

Handoff files track:
- Current step number
- Assigned agent
- Input file paths
- Output file paths
- Status: `pending | in-progress | awaiting-approval | complete | failed | escalated`
- Approvals received (with timestamp and approver)
- Notes or escalation reasons

---

## Workflow Chaining

Workflows are chained when the output of one is the input of the next:

```
W-03 → W-04 → W-05 → W-06 → W-07
```

The Master Orchestrator Agent monitors chain progress and activates the next workflow automatically when prerequisites are met and any required approvals are received.

---

## Adding New Workflows

When a new workflow is needed:

1. Create a definition file in `/automation/workflows/[w-id]-[name].md`
2. Add it to this inventory table
3. Update the routing table in `/docs/orchestration/routing-logic.md`
4. Define its trigger in `/config/triggers/`
5. Define its approval gates in `/config/approvals/`
