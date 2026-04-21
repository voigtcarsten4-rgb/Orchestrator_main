# Workflow W-11: Desktop and File Intake Review

**ID:** W-11  
**Status:** Active — Analysis Only  
**Primary Agent:** A-14 Desktop and File Hygiene Agent  
**Trigger:** Human provides a file listing for review

---

## Purpose

Classify and analyse a provided file set to produce a routing plan, hygiene summary, and duplicate candidate list. **This workflow is analysis-only. No files are moved, renamed, or deleted at any point. All recommended actions require individual human approval before execution.**

---

## Trigger Conditions

- Human provides a file listing for review (T-01-05)
- Human requests a file hygiene analysis for a folder or project area

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Human provides file listing | Human | File tree or list | Input in `/data/inbox/` | **Input required** |
| 2 | A-01 assigns analysis to A-14 | A-01 | File listing | Task assignment | None |
| 3 | Classify every file with category tag | A-14 | File listing | Classified file list | None |
| 4 | Identify duplicate candidates | A-14 | Classified list | Duplicate candidates list | None |
| 5 | Produce routing recommendations | A-14 | Classified list | Routing plan (recommendations only) | None |
| 6 | Produce hygiene summary | A-14 | All above | Summary counts by category | None |
| 7 | Human reviews classification, routing plan, and duplicates | Human | All outputs | Decisions on each item | **GATE** |
| 8 | Human manually executes approved actions | Human | Approved plan | File operations (human only) | Human action only |

---

## Required Inputs

- File listing provided by human operator (tree output, plain text list, or structured data)
- File type, size, and date modified (where available)
- Human-provided context about file purpose or project

---

## Classification Tags Used

`[KEEP]` | `[ARCHIVE]` | `[REVIEW]` | `[DUPLICATE-CANDIDATE]` | `[SENSITIVE]` | `[EMPTY-OR-PLACEHOLDER]`

---

## Outputs

- File classification report: `/data/reports/[YYYY-MM-DD]-file-classification.md`
- Routing plan: `/data/drafts/reports/[YYYY-MM-DD]-file-routing-plan.md`
- Hygiene summary: `/data/reports/[YYYY-MM-DD]-file-hygiene-summary.md`
- Duplicate candidates: `/data/reports/[YYYY-MM-DD]-duplicate-candidates.md`
- Handoff file: `/automation/handoffs/W-11-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|-----------------|--------------|-----------------|-------|
| Step 7 — per file action | Every recommended file operation | Human operator — per item | Any file is moved/archived/deleted | BLOCKED for auto-execution |

---

## CRITICAL Safety Rules

1. **No file is deleted, moved, or renamed by any agent at any point in this workflow**
2. Every file action recommendation requires explicit human approval for that specific file
3. Bulk or batch file operations are never approved — only per-item approvals
4. `[SENSITIVE]` tagged files must be escalated to human immediately — no batch processing

---

## Failure / Escalation

- File listing contains clearly sensitive material: flag immediately, halt further processing of that file
- Duplicate candidates cannot be determined without human context: mark `[HUMAN DECISION REQUIRED]`
- File listing is too large for reliable per-item analysis: flag, request human to narrow scope

---

## Prompt File

[/automation/prompts/workflows/w-11-desktop-file-review-prompt.md](../prompts/workflows/w-11-desktop-file-review-prompt.md)
