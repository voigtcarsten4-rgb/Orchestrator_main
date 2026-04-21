# Data Flow Model

## How Data Moves Through the System

---

## 1. Overview

Data in this system follows a strict one-directional flow from raw input to approved export. No stage overwrites a previous stage. Every stage is stored separately.

---

## 2. Data Flow Diagram

```
External Source
(website, email, file, calendar input)
            |
            ▼
    data/inbox/         ← Incoming unprocessed material
            |
            ▼
    data/raw/           ← Preserved source copy, immutable
            |
            ▼
Agent Processing (extraction, classification, structuring)
            |
            ▼
    data/extracted/     ← Machine-structured extraction, close to source
            |
            ▼
    data/mapped/        ← Content mapped to schemas (app, content, etc.)
            |
            ▼
    data/normalized/    ← Cleaned, classified, confidence-marked
            |
            ▼
    data/drafts/        ← Agent-generated drafts awaiting human review
            |
            ▼
    Human Review + Approval Gate
            |
            ▼
    data/exports/       ← Approved, final outputs
            |
            ▼
    data/reports/       ← Archived operational and system reports
```

---

## 3. Data Layer Definitions

| Layer | Path | Description | Mutable? |
|---|---|---|---|
| Inbox | `data/inbox/` | Incoming material before any processing | Yes — consumed |
| Raw | `data/raw/` | Source material as received, no modification | **Never modified** |
| Extracted | `data/extracted/` | Structured extraction, minimal interpretation | Agent-writes once |
| Mapped | `data/mapped/` | Schema-mapped version (app, content, etc.) | Agent-writes once |
| Normalized | `data/normalized/` | Cleaned, classified, confidence-marked | Agent-writes once |
| Drafts | `data/drafts/` | Output drafts awaiting review | Revisable pre-approval |
| Exports | `data/exports/` | Approved, final outputs | Human-approved only |
| Reports | `data/reports/` | System and operational reports | Append-only |
| Reference | `data/reference/` | Stable reference material | Human-managed |

---

## 4. Immutability Rules

- `data/raw/` is **never modified** after initial storage
- Once an extraction is stored in `data/extracted/`, a new version must be created (not overwritten)
- Exports are final — modifications create a new versioned export
- Reports are append-only — no retroactive editing

---

## 5. Version Management

When content is revised:

- Create a new file with a version suffix: `-v2`, `-v3`
- Never delete the previous version during active workflow
- Approved exports use the format: `[project-id]-[type]-approved-[YYYY-MM-DD].md`

---

## 6. Data Quality Standards

Every data file must include a header:

```markdown
---
source: [URL, file path, or input description]
agent: [agent ID]
workflow: [workflow ID and step]
date: [YYYY-MM-DD]
status: [raw | extracted | mapped | normalized | draft | exported]
confidence: [high | medium | low | mixed]
---
```

---

## 7. Sensitive Data Policy

- No personal data (emails, phone numbers, addresses) stored in shared repository areas
- Email content stays in `data/inbox/` (gitignored) and is not committed to the repository
- Calendar data with personal attendee information is not committed to the repository
- Any sensitive data identified during extraction must be flagged for human handling

---

## 8. Reference Data

`data/reference/` contains stable, human-curated reference material:

- Project briefs
- Client background documents
- Base app schema reference
- Brand guidelines
- Glossary and terminology

Reference files are human-managed and are not modified by agents unless explicitly instructed.
