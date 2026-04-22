# Prompts — Executive Assistant System

**Module:** Executive Assistant System  
**Last updated:** 2026-04-22

---

## Overview

This directory contains all ready-to-use prompts for the Executive Assistant System. Each prompt is a standalone document that can be copied directly into an AI assistant session or used via the Orchestrator_main agent system.

---

## Prompt Inventory

| File | Purpose | Phase | Safety level |
|------|---------|-------|-------------|
| `READ_ONLY_OUTLOOK_AUDIT_PROMPT.md` | Full read-only Outlook account audit | Phase 1 | Read-only — no changes |
| `FINAL_SYSTEM_COMPLETION_PROMPT.md` | Prompt to verify and complete system setup | Phase 1 | Read-only — no changes |

---

## Prompt Usage Rules

1. **Never run a prompt that modifies data in Phase 1** — all prompts in this directory are read-only or DRAFT-only
2. **Paste the prompt content directly** into your AI assistant — do not summarise or abbreviate it
3. **Review all output before acting** — every prompt produces DRAFT output
4. **Save prompt output** to `reports/` with date and prompt name in the filename
5. **Note which accounts or data sources you used** — output files should reference the input scope

---

## Output Naming Convention

```
reports/[YYYY-MM-DD]-[prompt-name]-[scope].md

Examples:
  reports/2026-04-22-outlook-audit-business-account.md
  reports/2026-04-22-outlook-audit-private-account.md
```

---

## Adding New Prompts

When a new prompt is needed:

1. Create the file in this directory following the naming convention `[PURPOSE]_PROMPT.md`
2. Include a header block with: Purpose, Phase, Safety level, Input required, Expected output
3. Add it to the inventory table above
4. Commit and push — do not run a prompt that has not been committed to the repository

---

*References: `READ_ONLY_OUTLOOK_AUDIT_PROMPT.md`, `FINAL_SYSTEM_COMPLETION_PROMPT.md`*
