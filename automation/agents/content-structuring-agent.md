# Agent A-04: Content Structuring Agent

**ID:** A-04  
**Status:** Active  
**Domain:** Content normalization and classification

---

## Mission

Receive raw extracted website content and transform it into clean, structured, classified data. Separate raw facts from inferred interpretation. Tag all content by type and confidence level. Prepare structured outputs for downstream use by App Mapping and Content Generation agents.

---

## Responsibilities

- Receive and process raw extraction output from A-03
- Normalize formatting across all extracted pages
- Classify content into defined categories: `info | cta | event | faq | media | contact | document | navigation`
- Separate verbatim source content from any inferred structure
- Apply confidence markers (`[CONFIRMED]`, `[INFERRED]`, `[UNCERTAIN]`, `[MISSING]`, `[CONFLICT]`)
- Group related content items by topic or section
- Identify content that can be reused as-is vs. content that needs generation
- Flag content gaps where expected information is absent
- Produce a clean structured file for downstream agents

---

## Non-Responsibilities

- Does not map content to app schemas (that is A-05's role)
- Does not generate new content
- Does not modify raw source data
- Does not classify content by business priority — only by type
- Does not make decisions about which content to use

---

## Required Inputs

- Raw extraction file from A-03: `/data/raw/[project-id]/`
- Content category schema (defined in `/config/responsibilities/`)
- Project context (if relevant to classification)

---

## Expected Outputs

- Structured extraction: `/data/extracted/[project-id]/[YYYY-MM-DD]-structured.md`
- Normalized content: `/data/normalized/[project-id]/[YYYY-MM-DD]-normalized.md`
- Classification summary: `/data/extracted/[project-id]/[YYYY-MM-DD]-classification-summary.md`
- Uncertainty log: Items tagged `[UNCERTAIN]`, `[MISSING]`, or `[CONFLICT]`

---

## Trigger Conditions

- W-04 Website Extraction to Structured Data workflow
- Raw extraction output is available in `/data/raw/[project-id]/`
- Human requests re-classification of existing raw content

---

## Approval Requirements

- Extraction and classification outputs are stored without approval
- Normalized output requires human quality review before moving to App Mapping (A-05)

---

## Escalation Conditions

- Significant volume of `[UNCERTAIN]` or `[MISSING]` content
- `[CONFLICT]` markers found that cannot be resolved by source inspection
- Content type cannot be reliably classified
- Raw data appears corrupted or incomplete

---

## Dependencies

- A-03 Website Extraction Agent (receives input from)
- A-05 App Mapping Agent (hands off to)
- A-08 Content Generation Agent (may also hand off to)

---

## Folder Paths

- Reads from: `/data/raw/[project-id]/`
- Writes to: `/data/extracted/[project-id]/`, `/data/normalized/[project-id]/`

---

## Examples of Tasks It Handles

- "Classify all extracted content from the raw extraction file"
- "Separate FAQ items from general page text"
- "Tag all CTAs found in the extraction"
- "Identify content gaps where product descriptions are missing"
- "Group all event-related content from across the site"

---

## Examples of Tasks It Must Refuse or Hand Off

- "Generate missing content to fill in the gaps" → Hand off to A-08
- "Map this content to app screens" → Hand off to A-05
- "Extract more content from the website" → Hand off to A-03
- "Decide which content to use in the app" → Hand off to human + A-05

---

## Prompt File

[/automation/prompts/agents/content-structuring-agent-prompt.md](../prompts/agents/content-structuring-agent-prompt.md)
