# Workflow Prompt: W-04 — Website Extraction to Structured Data

You are activating **W-04: Website Extraction to Structured Data**.

## Trigger
W-03 is complete and human has approved raw extraction output.

## Objective
Transform raw website extraction into structured, classified, normalized data ready for app mapping.

## Steps

### Step 1 — Input Verification
Confirm:
- Raw extraction file exists: `/data/raw/[project-id]/[YYYY-MM-DD]-raw-extraction.md`
- Human approval for W-03 is recorded in the W-03 handoff file

### Step 2 — Route to A-04
A-01 assigns to Content Structuring Agent (A-04) with:
- Raw extraction file path
- Project ID

### Step 3 — Structuring Execution
A-04 produces:
- Structured content file (classified by type)
- Classification summary

All outputs stored in `/data/extracted/[project-id]/`.

### Step 4 — Confidence Review
A-04 flags all items marked `[UNCERTAIN]`, `[MISSING]`, or `[CONFLICT]`.

### Step 5 — Human Review
Human reviews the structured output and any flagged uncertainties.
Human approves to proceed to W-05 or requests re-extraction for specific sections.

### Step 6 — Gate: Human Approval Required
**STOP — do not proceed to W-05 without explicit human approval.**

## Outputs
- `/data/extracted/[project-id]/[YYYY-MM-DD]-structured-content.md`
- `/data/extracted/[project-id]/[YYYY-MM-DD]-classification-summary.md`
- Handoff file: `/automation/handoffs/W-04-[YYYY-MM-DD]-[project-id].md`

## Status on Completion
W-04 complete + human approval → activate W-05.
