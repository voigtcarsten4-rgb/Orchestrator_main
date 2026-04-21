# Website Ingestion Operating Model

## How Website Content Is Extracted, Structured, and Processed

---

## 1. Purpose

This document defines how external websites are ingested into the system — from initial URL input through deep extraction, structuring, classification, and preparation for downstream use.

---

## 2. Ingestion Workflow Overview

```
Human provides URL(s)
        ↓
Website Extraction Agent (A-03)
        ↓
data/raw/[project-id]/          ← Raw content preserved
        ↓
Content Structuring Agent (A-04)
        ↓
data/extracted/[project-id]/    ← Structured extraction
        ↓
data/normalized/[project-id]/   ← Classified and cleaned
        ↓
Human quality review
        ↓
App Mapping Agent (A-05) or Content Generation Agent (A-08)
```

---

## 3. What the Extraction Agent Captures

The Website Extraction Agent (A-03) extracts all available:

| Content Type | Examples |
|---|---|
| Page structure | URL hierarchy, navigation, sitemap |
| Text content | All headings, paragraphs, descriptions |
| Calls to action | Buttons, forms, contact links, booking flows |
| Media | Image filenames, alt texts, video embeds |
| Documents | PDF links, downloadable files |
| Contact data | Phone numbers, addresses, email addresses |
| Events | Dates, times, locations, event titles |
| FAQs | Question-answer pairs |
| Links | Internal navigation, external references |
| Schema/metadata | Page titles, meta descriptions, Open Graph data |

---

## 4. Extraction Quality Standards

Every extraction must:

- Preserve all extracted text verbatim in raw form
- Note the source URL for every piece of content
- Distinguish between confirmed content and inferred structure
- Mark missing or inaccessible content explicitly
- Not invent or assume content that is not present

---

## 5. Structuring and Classification

The Content Structuring Agent (A-04) then:

- Normalizes formatting across all pages
- Classifies content into predefined categories
- Separates raw facts from implied interpretation
- Tags content by type: `info | cta | event | faq | media | contact | document`
- Prepares structured output for downstream use

---

## 6. Prohibited Extraction Actions

- No authenticated sessions or login bypass
- No extraction from password-protected pages without explicit permission
- No storage of personal user data from contact forms
- No automated form submission
- No crawling that violates the site's robots.txt

---

## 7. Output Locations

| Stage | Location |
|---|---|
| Raw extracted content | `/data/raw/[project-id]/[YYYY-MM-DD]-raw-extraction.md` |
| Structured extraction | `/data/extracted/[project-id]/[YYYY-MM-DD]-structured.md` |
| Normalized output | `/data/normalized/[project-id]/[YYYY-MM-DD]-normalized.md` |
| Quality review notes | `/data/extracted/[project-id]/[YYYY-MM-DD]-review-notes.md` |

---

## 8. Quality Review Checkpoint

Before any extracted content moves to App Mapping or Content Generation:

1. Human reviews a sample of extracted content against the live website
2. Agent-noted `[UNCERTAIN]` or `[MISSING]` items are resolved
3. Any conflicts between page versions are flagged
4. Human approves the normalized output for downstream use

---

## 9. What Remains Manual

- Initial URL list provision
- Quality spot-check of extraction
- Approval before downstream use
- Decision on which pages to include or exclude
