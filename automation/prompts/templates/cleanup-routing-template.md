# Template: Cleanup and Routing Plan

**Usage:** Used by A-14 (Desktop and File Hygiene Agent) for all file analysis and routing plan outputs.

---

## File Cleanup and Routing Plan Template

```
PLAN TYPE: [File Classification / Routing Plan / Hygiene Summary / Duplicate Analysis]
STATUS: [ANALYSIS ONLY — NO ACTIONS TAKEN]
Date: [YYYY-MM-DD]
Agent: A-14 Desktop and File Hygiene Agent
Workflow: W-11
Scope: [folder path or description provided by human]

---

## IMPORTANT

This document contains recommendations only. No files have been moved, renamed, or deleted.
Every recommended action requires explicit human approval before execution.

---

## Summary

Total files analysed: X
[KEEP]: X
[ARCHIVE]: X
[REVIEW]: X
[DUPLICATE-CANDIDATE]: X
[SENSITIVE]: X
[EMPTY-OR-PLACEHOLDER]: X

---

## Full Classification Table

| Filename | Type | Size | Date Modified | Tag | Recommended Action | Notes |
|----------|------|------|---------------|-----|--------------------|-------|
| ... | ... | ... | ... | [KEEP] | Keep in place | ... |
| ... | ... | ... | ... | [ARCHIVE] | Move to /archive/[folder] | ... |
| ... | ... | ... | ... | [REVIEW] | Human must decide | ... |

---

## Sensitive Items — Immediate Human Review Required

List every file tagged `[SENSITIVE]`:

1. [Filename] — [reason flagged] — [recommended action: human decision required]

---

## Duplicate Candidates

| File A | File B | Similarity Indicator | Recommendation |
|--------|--------|----------------------|----------------|
| ... | ... | Same name + date | Keep A, archive B [HUMAN DECISION REQUIRED] |

---

## Routing Recommendations

For files recommended for relocation:

| Filename | Current Location | Recommended Destination | Reason | Status |
|----------|-----------------|------------------------|--------|--------|
| ... | ... | ... | ... | [PENDING HUMAN APPROVAL] |

---

## Traceability

Source: File listing provided by human operator
Agent: A-14
Workflow: W-11
Date: [YYYY-MM-DD]
Status: analysis-only
Approved by: N/A — no actions taken
```

---

## Usage Notes

- **Do not execute any file operation based on this document without explicit human approval per item**
- All `[SENSITIVE]` items require immediate escalation to human review — do not include them in batch recommendations
- `[HUMAN DECISION REQUIRED]` must appear on every duplicate recommendation
