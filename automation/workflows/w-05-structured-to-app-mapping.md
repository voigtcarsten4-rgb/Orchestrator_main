# Workflow W-05: Structured Data to App Mapping

**ID:** W-05  
**Status:** Active  
**Primary Agent:** A-05 App Mapping Agent  
**Trigger:** W-04 complete and human approval recorded

---

## Purpose

Map classified and normalized content to a structured app schema. Define every screen, assign content blocks to screens, define data fields, and identify all gaps where content is missing or insufficient.

---

## Trigger Conditions

- W-04 complete AND human approval recorded in W-04 handoff file (T-04-02)

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | A-01 confirms W-04 approval and activates A-05 | A-01 | W-04 handoff | Task assignment | None |
| 2 | Identify and define app screens from classified content | A-05 | Structured content | Screen list | None |
| 3 | Assign content blocks to screens | A-05 | Screen list + content | Content assignment per screen | None |
| 4 | Produce field-level data schema per content type | A-05 | Assignments | Data schema | None |
| 5 | Gap analysis — identify missing or low-confidence content per screen | A-05 | All above | Gap analysis | None |
| 6 | Human reviews app map, schema, and gaps | Human | All outputs | Approval / revision | **GATE** |

---

## Required Inputs

- Structured content: `/data/extracted/[project-id]/[YYYY-MM-DD]-structured-content.md`
- W-04 handoff with human approval

---

## Screens Mapped (Standard Set)

Home / Landing | Services / Products | About / Team | Contact | FAQ | Events | Legal / Terms | Other (named)

---

## Outputs

- App map: `/data/mapped/[project-id]/[YYYY-MM-DD]-app-map.md`
- Data schema: `/data/mapped/[project-id]/[YYYY-MM-DD]-data-schema.md`
- Gap analysis: `/data/mapped/[project-id]/[YYYY-MM-DD]-gap-analysis.md`
- Handoff file: `/automation/handoffs/W-05-[YYYY-MM-DD]-[project-id].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before |
|------|-----------------|--------------|-----------------|
| Step 6 | Screen structure, content assignments, data schema, gaps | Human operator | W-06 begins |

---

## Failure / Escalation

- Content insufficient to define a screen: mark screen as `[INSUFFICIENT-CONTENT]` in gap analysis, escalate
- Schema field types cannot be determined from available content: flag each case, request human guidance
- Unexpected content type not in standard screen set: propose a new screen, request human decision

---

## Chaining

W-05 complete + human approval → A-01 activates W-06 (T-04-03)

---

## Prompt File

[/automation/prompts/workflows/w-05-structured-to-app-mapping-prompt.md](../prompts/workflows/w-05-structured-to-app-mapping-prompt.md)
