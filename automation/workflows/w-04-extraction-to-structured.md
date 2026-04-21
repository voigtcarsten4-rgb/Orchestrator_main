# Workflow W-04: Website Extraction to Structured Data

**ID:** W-04  
**Status:** Active  
**Primary Agent:** A-04 Content Structuring Agent  
**Trigger:** W-03 complete and human approval recorded

---

## Purpose

Transform raw website extraction content into structured, classified, and normalized data. Assign content types, standardize formats, remove duplicates, and apply confidence markers throughout.

---

## Trigger Conditions

- W-03 complete AND human approval recorded in W-03 handoff file (T-04-01)

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | A-01 confirms W-03 approval and activates A-04 | A-01 | W-03 handoff | Task assignment | None |
| 2 | Content classification — type each block | A-04 | Raw extraction | Classified blocks | None |
| 3 | Normalization — standardize formats, remove duplicates | A-04 | Classified blocks | Normalized blocks | None |
| 4 | Confidence annotation — apply markers to all items | A-04 | Normalized blocks | Annotated output | None |
| 5 | Produce structured content file and classification summary | A-04 | All above | Structured content + summary | None |
| 6 | Human reviews structured output and flagged items | Human | Structured outputs | Approval / revision request | **GATE** |

---

## Required Inputs

- Raw extraction: `/data/raw/[project-id]/[YYYY-MM-DD]-raw-extraction.md`
- W-03 handoff with human approval recorded

---

## Content Types Classified

`service` | `product` | `feature` | `testimonial` | `team-member` | `faq` | `cta` | `contact` | `event` | `legal` | `navigation` | `footer` | `misc`

---

## Confidence Markers Applied

`[CONFIRMED]` | `[INFERRED]` | `[UNCERTAIN]` | `[MISSING]` | `[CONFLICT]`

---

## Outputs

- Structured content: `/data/extracted/[project-id]/[YYYY-MM-DD]-structured-content.md`
- Classification summary: `/data/extracted/[project-id]/[YYYY-MM-DD]-classification-summary.md`
- Handoff file: `/automation/handoffs/W-04-[YYYY-MM-DD]-[project-id].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before |
|------|-----------------|--------------|-----------------|
| Step 6 | Classification accuracy, flagged uncertainties | Human operator | W-05 begins |

---

## Failure / Escalation

- Large volume of `[UNCERTAIN]` items: surface list, request human guidance on classification rules
- `[CONFLICT]` items found: present both versions, request human resolution before proceeding
- Content volume exceeds expected scope: flag, request scope confirmation

---

## Chaining

W-04 complete + human approval → A-01 activates W-05 (T-04-02)

---

## Prompt File

[/automation/prompts/workflows/w-04-extraction-to-structured-prompt.md](../prompts/workflows/w-04-extraction-to-structured-prompt.md)
