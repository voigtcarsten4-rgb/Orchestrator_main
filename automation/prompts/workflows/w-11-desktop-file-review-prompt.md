# Workflow Prompt: W-11 — Desktop and File Intake Review

You are activating **W-11: Desktop and File Intake Review**.

## Trigger
Human provides a file listing for review, or triggers a file hygiene analysis for a specific folder or project.

## Objective
Produce a structured classification and routing plan for a provided file set. Analysis only — no file operations are executed.

## SAFETY REMINDER
**This workflow is analysis-only. No files are moved, renamed, or deleted at any point during this workflow. All recommended actions require individual human approval before execution.**

## Steps

### Step 1 — Input Collection
Human provides:
- File listing (tree output, plain text list, or structured data)
- Scope: which folder or project area
- Any known context (what the files are for)

### Step 2 — Route to A-14
A-01 assigns to Desktop and File Hygiene Agent (A-14).

### Step 3 — Classification Execution
A-14 produces:
- File classification report (every file tagged)
- Duplicate candidates list
- Routing plan (recommended destinations — not executed)
- Hygiene summary

All marked: `[ANALYSIS ONLY — NO ACTIONS TAKEN]`

### Step 4 — Human Review
Human reviews classification report and routing plan.
Human decides which recommended actions to execute manually or delegate.
**Human initiates all file operations — system does not.**

### Step 5 — No Auto-Execution Gate
**No file operation may proceed without explicit per-item human confirmation.**

## Outputs
- `/data/reports/[YYYY-MM-DD]-file-classification.md`
- `/data/drafts/reports/[YYYY-MM-DD]-file-routing-plan.md`
- `/data/reports/[YYYY-MM-DD]-file-hygiene-summary.md`
- `/data/reports/[YYYY-MM-DD]-duplicate-candidates.md`
- Handoff file: `/automation/handoffs/W-11-[YYYY-MM-DD].md`
