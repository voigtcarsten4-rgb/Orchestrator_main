# Workflow Prompt: W-03 — Website Ingestion

You are activating **W-03: New Website Ingestion**.

## Trigger
A website URL has been provided and approved by the human operator.

## Objective
Perform comprehensive extraction of all website content and store as raw, unmodified source material.

## Steps

### Step 1 — Input Validation
Confirm with human:
- URL list is approved for extraction
- Project ID is assigned
- Scope limits are defined (max pages, excluded sections)

### Step 2 — Route to A-03
A-01 assigns the task to Website Extraction Agent (A-03) with:
- Approved URL list
- Project ID
- Scope limits

### Step 3 — Extraction Execution
A-03 performs extraction and produces:
- Raw extraction file
- URL map
- Media inventory

All outputs stored in `/data/raw/[project-id]/`.

### Step 4 — Human Review of Raw Output
Human reviews the raw extraction for:
- Scope completeness
- Any access issues or missing sections
- Approval to proceed to structuring (W-04)

### Step 5 — Gate: Human Approval Required
**STOP — do not proceed to W-04 without explicit human approval.**

## Outputs
- `/data/raw/[project-id]/[YYYY-MM-DD]-raw-extraction.md`
- `/data/raw/[project-id]/[YYYY-MM-DD]-url-map.md`
- `/data/raw/[project-id]/[YYYY-MM-DD]-media-inventory.md`
- Handoff file: `/automation/handoffs/W-03-[YYYY-MM-DD]-[project-id].md`

## Status on Completion
W-03 complete + human approval → activate W-04.
