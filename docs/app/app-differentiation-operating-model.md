# App Differentiation Operating Model

## How App Variants Are Derived from the Base Application

---

## 1. Purpose

This document defines how the system derives differentiated application variants from a protected base application using structured, extracted, and mapped content from client websites and project sources.

---

## 2. Core Principle

**The base application is protected.** App differentiation creates variants — it does not modify the base. All differentiation work is tracked, versioned, and approved before any application is affected.

---

## 3. Differentiation Pipeline

```
Website Extraction (A-03)
        ↓
Content Structuring (A-04)
        ↓
App Mapping (A-05)
        ↓
App Differentiation (A-06)    ← BASE APP is reference-only here
        ↓
Human Approval Gate
        ↓
Content/Asset Preparation (A-07, A-08)
        ↓
Differentiation Package (data/exports/[project-id]/app/)
```

---

## 4. Base Application Rules

| Rule | Description |
|---|---|
| Base app is read-only | No differentiation agent modifies the base app |
| Base app is the reference | All variants describe what is changed relative to the base |
| Base app changes require separate process | Modifying the base requires a distinct, human-initiated workflow |
| Base app path is defined in config | Location is stored in `/config/responsibilities/base-app-reference.md` |

---

## 5. Differentiation Categories

For each differentiated app, the App Differentiation Agent (A-06) defines:

| Category | Description |
|---|---|
| Reused | Features and content carried unchanged from the base |
| Renamed | Base features renamed for this client/context |
| Modified | Base features with content or behavior changes |
| Added | New features specific to this differentiation |
| Protected | Features that must not be changed in this variant |
| Removed | Base features excluded from this variant |

---

## 6. Mapping Relevance Schema

The App Mapping Agent (A-05) scores each piece of extracted content for app relevance:

- `screen_relevance` — which app screens this content relates to
- `table_relevance` — which data tables or schemas this maps to
- `cta_relevance` — which calls-to-action this content supports
- `faq_relevance` — whether this is FAQ-suitable
- `event_relevance` — whether this relates to events or scheduling
- `poi_relevance` — whether this is a point-of-interest entry
- `image_relevance` — which visual assets support this content

---

## 7. Approval Gates in Differentiation

| Gate | What is Reviewed | Who Approves |
|---|---|---|
| Post-mapping review | App mapping schema and relevance scores | Human operator |
| Post-differentiation review | Full differentiation plan (reused/renamed/added/removed) | Human operator |
| Pre-content-generation | Approved differentiation plan before copy is written | Human operator |
| Final export | Complete differentiation package | Human operator |

---

## 8. Output Structure

Differentiation outputs are stored as:

```
/data/exports/[project-id]/app/
├── differentiation-plan.md      ← Full reuse/rename/add/remove plan
├── screen-definitions.md        ← App screen list and content mapping
├── table-schemas.md             ← Data table definitions
├── cta-definitions.md           ← Call-to-action definitions
├── faq-content.md               ← FAQ entries
├── content-package.md           ← Approved copy and descriptions
└── asset-briefing.md            ← Asset needs and image briefings
```

---

## 9. What Remains Manual

- Final decision on which base features to protect
- Approval of differentiation plan
- Review of content tone and accuracy
- App build and deployment (never automated)
