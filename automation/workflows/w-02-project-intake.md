# Workflow W-02: New Project or Client Intake

**ID:** W-02  
**Status:** Active  
**Primary Agent:** A-01 Master Orchestrator Agent  
**Trigger:** Human initiates a new project or client engagement

---

## Purpose

Register a new project or client engagement in the system. Create the required folder structure, document the project brief, and route the project to the appropriate downstream workflow based on project type.

---

## Trigger Conditions

- Human initiates a new project (T-01-01)
- New client engagement begins requiring system support

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Collect project information from human | A-01 | Human input | Project brief draft | None |
| 2 | Create project folder structure | A-02 | Project ID | Folder structure | None |
| 3 | Create project reference file | A-02 | Project brief | `/data/reference/[project-id]-project-brief.md` | None |
| 4 | Human confirms project brief is accurate | Human | Project brief | Approval | **GATE** |
| 5 | Route to downstream workflow based on project type | A-01 | Approved brief | Workflow activation | None |

---

## Required Inputs

- Project ID (format: `[CLIENT-CODE]-[YYYY-MM-DD]`)
- Client name and description
- Project type: website ingestion / content generation / operations / other
- Scope notes
- Relevant URLs (for website ingestion projects)
- Deadline or timeline

---

## Folder Structure Created

```
/data/raw/[project-id]/
/data/extracted/[project-id]/
/data/mapped/[project-id]/
/data/normalized/[project-id]/
/data/drafts/content/[project-id]/
/data/drafts/assets/[project-id]/
/data/exports/[project-id]/
```

---

## Outputs

- Project brief: `/data/reference/[project-id]-project-brief.md`
- Project folder structure (created)
- Handoff file: `/automation/handoffs/W-02-[YYYY-MM-DD]-[project-id].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before |
|------|-----------------|--------------|-----------------|
| Step 4 | Project brief accuracy, scope, and routing decision | Human operator | Downstream workflows begin |

---

## Routing Decisions

| Project Type | Downstream Workflow |
|---|---|
| Website ingestion | W-03 → W-04 → W-05 → W-06 → W-07 |
| Content generation only | W-07 |
| Operations / daily management | W-08 (daily briefing) |
| Reporting | W-12 |

---

## Failure / Escalation

- Incomplete project information → A-01 requests clarification before creating the brief
- Project type cannot be determined → A-01 escalates to human for routing decision

---

## Prompt File

[/automation/prompts/workflows/w-02-project-intake-prompt.md](../prompts/workflows/w-02-project-intake-prompt.md)
