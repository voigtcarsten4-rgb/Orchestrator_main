# Final System Completion Prompt

**Module:** Executive Assistant System — Prompts  
**Phase:** 1 — Read-only verification  
**Safety level:** READ-ONLY — verification and gap analysis only  
**Purpose:** Verify that the Executive Assistant System is fully set up and ready for Phase 1 operation  
**Last updated:** 2026-04-22

---

## How to Use This Prompt

Run this prompt once after completing the Implementation Readiness Checklist and before starting the first real Outlook audit. It confirms that all components are in place and identifies any gaps.

---

## Prompt Start

---

You are a system verification agent for the Orchestrator_main Executive Assistant System. Your task is to verify that the system is fully prepared for Phase 1 operations and to identify any gaps.

**RULES:**
- Read-only verification only
- No files will be created, modified, or deleted by this prompt
- Output is a DRAFT status report

---

## VERIFICATION SECTION 1 — Repository Structure

Confirm that the following files exist and are non-empty in the `/executive_assistant/` module:

**Required files:**

```
executive_assistant/README.md
executive_assistant/docs/SYSTEM_SCOPE.md
executive_assistant/docs/TARGET_ARCHITECTURE.md
executive_assistant/docs/IMPLEMENTATION_PHASES.md
executive_assistant/docs/GLOBAL_ADDRESS_BOOK_PLAN.md
executive_assistant/docs/IMPLEMENTATION_READINESS_CHECKLIST.md
executive_assistant/outlook_rules/OUTLOOK_LABEL_MODEL.md
executive_assistant/outlook_rules/OUTLOOK_TARGET_MODEL.md
executive_assistant/schemas/CONTACT_SCHEMA.md
executive_assistant/finance/FINANCE_ASSISTANT_SPEC.md
executive_assistant/finance/FINANCE_DATA_MODEL.md
executive_assistant/finance/FINANCE_RISK_LOGIC.md
executive_assistant/finance/FINANCE_PARETO_MODEL.md
executive_assistant/finance/FINANCE_BRIEFING_EXTENSION.md
executive_assistant/briefing/BRIEFING_EXPANSION_PLAN.md
executive_assistant/prompts/README.md
executive_assistant/prompts/READ_ONLY_OUTLOOK_AUDIT_PROMPT.md
executive_assistant/signatures/WAVEBITE_SIGNATURE.html
executive_assistant/signatures/PRIVATE_SIGNATURE.html
executive_assistant/reports/README.md
executive_assistant/templates/BRIEFING_HTML_GUIDELINES.md
executive_assistant/templates/FINANCE_SUMMARY_TEMPLATE.md
executive_assistant/templates/CONTACT_EXPORT_TEMPLATE.csv
```

For each file:
- Mark ✅ if present and has substantive content
- Mark ❌ if missing or empty
- Mark ⚠️ if present but appears incomplete

---

## VERIFICATION SECTION 2 — Readiness Checklist Status

Review `docs/IMPLEMENTATION_READINESS_CHECKLIST.md`. Report:

- How many checklist items have been completed (checked)?
- How many are still open?
- Are any items in Section 1 (Repository), Section 7 (Security) still open?
- Is there a go/no-go operator sign-off present?

---

## VERIFICATION SECTION 3 — Security Check

Confirm that none of the following are present in the `/executive_assistant/` directory:

- [ ] Real email addresses
- [ ] Real local file system paths
- [ ] API keys or authentication tokens
- [ ] Passwords or credentials
- [ ] Real personal or company names (beyond generic placeholders)
- [ ] Real account names or usernames

Report any findings. Flag as 🔴 SECURITY ISSUE if any credential-type data is found.

---

## VERIFICATION SECTION 4 — Phase 1 Readiness

Rate each Phase 1 activity on a readiness scale:

| Activity | Prompt available | Schema defined | Output path defined | Readiness |
|----------|-----------------|---------------|--------------------|-|
| Outlook audit | | | | / 10 |
| Finance snapshot | | | | / 10 |
| Contact extraction | | | | / 10 |
| Pilot briefing | | | | / 10 |

For any item below 8/10, identify the gap and the recommended action to close it.

---

## VERIFICATION SECTION 5 — Gap Report

List any identified gaps:

| Gap | Location | Priority | Recommended action |
|-----|----------|----------|--------------------|
| | | | |

---

## OUTPUT FORMAT

```
| Field | Value |
|-------|-------|
| Source | FINAL_SYSTEM_COMPLETION_PROMPT.md |
| Date | [YYYY-MM-DD] |
| Status | DRAFT — verification report |
| Overall readiness | [X / 10] |
| Blockers for Phase 1 | [Yes / No — list if yes] |
| Recommended next step | [One sentence] |
```

---

**END OF PROMPT**

---

*References: `docs/IMPLEMENTATION_READINESS_CHECKLIST.md`, `docs/IMPLEMENTATION_PHASES.md`*
