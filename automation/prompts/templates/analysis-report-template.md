# Template: Analysis Report

**Usage:** Used by all agents when producing analysis or classification outputs.

---

## Analysis Report Template

```
REPORT TYPE: [Classification / Gap Analysis / Risk Report / Triage Report / Health Report]
STATUS: [DRAFT — PENDING REVIEW]
Date: [YYYY-MM-DD]
Agent: [Agent ID and Name]
Workflow: [Workflow ID and step]

---

## Executive Summary

[2–3 sentence summary of what was analysed, key finding, and recommended next action]

---

## Scope

- Input: [file path(s) or data source analysed]
- Coverage: [what was included / what was excluded]
- Limitations: [any known gaps in the analysis]

---

## Findings

### [Category 1]
| Item | Classification | Confidence | Notes |
|------|---------------|------------|-------|
| ... | ... | [CONFIRMED / INFERRED / UNCERTAIN] | ... |

### [Category 2]
[repeat as needed]

---

## Flags Requiring Human Review

List every item marked `[UNCERTAIN]`, `[MISSING]`, `[CONFLICT]`, or `[SENSITIVE]`:

1. [Item description] — [reason for flag] — [recommended action]

---

## Recommendations

[Numbered list of recommended next steps — for human decision, not auto-execution]

---

## Traceability

Source: [input file path]
Agent: [Agent ID]
Workflow: [Workflow ID]
Date: [YYYY-MM-DD]
Status: draft
Approved by: N/A
```

---

## Usage Notes

- Confidence markers must be applied consistently: `[CONFIRMED]`, `[INFERRED]`, `[UNCERTAIN]`, `[MISSING]`, `[CONFLICT]`
- The Flags section must never be empty if any uncertain items were found — it must list them explicitly
- Recommendations are for human consideration — no auto-execution
