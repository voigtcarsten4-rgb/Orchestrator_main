# Workflow W-03: New Website Ingestion

**ID:** W-03  
**Status:** Active  
**Primary Agent:** A-03 Website Extraction Agent  
**Trigger:** Website URL approved by human operator

---

## Purpose

Perform comprehensive extraction of all publicly accessible content from one or more approved website URLs. Preserve all content verbatim as raw source material. No interpretation or classification occurs in this workflow.

---

## Trigger Conditions

- Human provides a website URL and approves it for extraction (T-01-02)
- Scheduled re-ingestion of a known website (T-03, when configured and enabled)

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Human provides and approves URL list | Human | URL list | Approved URL list | **GATE — required before any crawl begins** |
| 2 | A-01 assigns extraction task to A-03 | A-01 | Approved URL list + project ID | Handoff file | None |
| 3 | URL map extraction | A-03 | Approved URLs | URL map file | None |
| 4 | Full content extraction | A-03 | Approved URLs | Raw extraction file | None |
| 5 | Media inventory extraction | A-03 | Approved URLs | Media inventory file | None |
| 6 | Schema and metadata extraction | A-03 | Approved URLs | Appended to raw extraction | None |
| 7 | Human reviews raw extraction for completeness | Human | Raw outputs | Approval to proceed | **GATE** |

---

## Required Inputs

- Approved URL list (provided by human)
- Project ID (from W-02)
- Scope limits: max pages, excluded sections (if any)

---

## Outputs

- Raw extraction: `/data/raw/[project-id]/[YYYY-MM-DD]-raw-extraction.md`
- URL map: `/data/raw/[project-id]/[YYYY-MM-DD]-url-map.md`
- Media inventory: `/data/raw/[project-id]/[YYYY-MM-DD]-media-inventory.md`
- Handoff file: `/automation/handoffs/W-03-[YYYY-MM-DD]-[project-id].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before |
|------|-----------------|--------------|-----------------|
| Step 1 | URL list approved for extraction | Human operator | Extraction begins |
| Step 7 | Raw extraction completeness and quality | Human operator | W-04 begins |

---

## Confidence Markers Used

- `[CONFIRMED]` — cleanly extracted content
- `[UNCERTAIN]` — ambiguous or partially visible
- `[MISSING]` — expected element not found
- `[INACCESSIBLE]` — page blocked, login required, or failed

---

## Failure / Escalation

- Page requires authentication: flag as `[INACCESSIBLE]`, note explicitly, continue with accessible pages
- Robots.txt restrictions conflict with scope: stop, escalate to human
- Dynamic rendering prevents reliable extraction: flag, escalate
- Large volumes of missing or uncertain content: flag in health report, human decides whether to re-scope

---

## Chaining

W-03 complete + human approval → A-01 activates W-04 (T-04-01)

---

## Prompt File

[/automation/prompts/workflows/w-03-website-ingestion-prompt.md](../prompts/workflows/w-03-website-ingestion-prompt.md)
