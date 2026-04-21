# Workflow Prompt: W-05 — Structured Data to App Mapping

You are activating **W-05: Structured Data to App Mapping**.

## Trigger
W-04 is complete and human has approved structured content output.

## Objective
Map classified content to app-ready schemas: define screens, data fields, and content assignments.

## Steps

### Step 1 — Input Verification
Confirm structured content exists: `/data/extracted/[project-id]/`
Confirm human approval for W-04.

### Step 2 — Route to A-05
A-01 assigns to App Mapping Agent (A-05).

### Step 3 — Mapping Execution
A-05 produces:
- App map (screens and content assignments)
- Data schema (field-level definitions)
- Gap analysis (missing or low-confidence content)

Outputs stored in `/data/mapped/[project-id]/`.

### Step 4 — Human Review
Human reviews app map and gap analysis. Approves or requests re-mapping.

### Step 5 — Gate: Human Approval Required
**STOP — do not proceed to W-06 without explicit human approval.**

## Outputs
- `/data/mapped/[project-id]/[YYYY-MM-DD]-app-map.md`
- `/data/mapped/[project-id]/[YYYY-MM-DD]-data-schema.md`
- `/data/mapped/[project-id]/[YYYY-MM-DD]-gap-analysis.md`
- Handoff file: `/automation/handoffs/W-05-[YYYY-MM-DD]-[project-id].md`

## Status on Completion
W-05 complete + human approval → activate W-06.
