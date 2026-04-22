# Target Architecture

**Module:** Executive Assistant System  
**Document type:** Architecture specification  
**Last updated:** 2026-04-22

---

## Architecture Overview

The Executive Assistant System is a modular, layered architecture that feeds into the existing Orchestrator_main system. Each module operates independently but produces outputs that can be combined in the daily CEO briefing.

```
┌─────────────────────────────────────────────────────────┐
│                  CEO / Operator Interface                │
│         (daily briefing · approval gates · actions)     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│              Daily CEO Briefing Engine                   │
│  (A-11 · expanded format · Pareto layer · finance layer) │
└──┬────────────┬─────────────┬──────────────┬────────────┘
   │            │             │              │
   ▼            ▼             ▼              ▼
Email       Calendar      Finance       File / Task
Triage      Module        Module        Hygiene
(A-09)      (A-10)        (A-13)        (A-14)
   │            │             │              │
   └────────────┴──────┬──────┴──────────────┘
                       │
          ┌────────────▼────────────┐
          │   Outlook Account Layer  │
          │  (read-only in Phase 1)  │
          │  Business + Private      │
          └──────────────────────────┘
```

---

## Module 1 — Daily CEO Briefing

**Agent:** A-11 (Daily Briefing and Operations Agent)  
**Extended by:** Briefing Expansion Plan (`briefing/BRIEFING_EXPANSION_PLAN.md`)

### Sections in the expanded briefing format

| Section | Content |
|---------|---------|
| Executive Summary | Top 3 priorities for today — one sentence each |
| Schedule | Appointments, conflicts, prep requirements |
| Open Decisions | Items requiring a human decision today |
| Email Highlights | Flagged email threads needing attention |
| Finance Alert | Open invoices, overdue items, risk summary |
| Risk Register | Flagged risks requiring attention this week |
| Quick Wins | Low-effort, high-value tasks for today |
| Contact Pulse | Key contacts with recent activity or follow-up due |
| Opportunity Radar | Business development and growth signals |
| Pareto Focus | The one or two actions delivering the most leverage today |
| Private Layer | Personal items requiring action |
| Confidence Summary | `[CONFIRMED]` `[INFERRED]` `[UNCERTAIN]` markers |

### Inputs

- Email triage output (`/data/drafts/email/`)
- Calendar summary (`/data/drafts/calendar/`)
- Finance module output (`/data/drafts/reports/finance/`)
- Open task list
- Previous briefing (for carryover items)

### Output

- `/assets/briefings/[YYYY-MM-DD]-ceo-briefing.md`

---

## Module 2 — Outlook Audit and Structure

**Agent:** A-09 (Email Triage and Drafting Agent)  
**Prompt:** `prompts/READ_ONLY_OUTLOOK_AUDIT_PROMPT.md`  
**Target model:** `outlook_rules/OUTLOOK_TARGET_MODEL.md`  
**Label model:** `outlook_rules/OUTLOOK_LABEL_MODEL.md`

### Phase 1 — Read-only audit

- Map all accounts and folder trees
- Count emails per folder and account
- Identify backlogs, orphaned folders, rule conflicts
- Surface authority mail, invoices, reminders, legal notices
- Produce a structural analysis report (DRAFT)

### Phase 2 — Structural improvement (operator approved)

- Apply target folder model
- Create rules for auto-classification
- Archive old material
- Consolidate duplicated folder structures

### Phase 3 — Ongoing maintenance

- Weekly triage pass
- Monthly folder health report

---

## Module 3 — Contact Extraction and Global Address Book

**Schema:** `schemas/CONTACT_SCHEMA.md`  
**Plan:** `docs/GLOBAL_ADDRESS_BOOK_PLAN.md`

### Process

1. Extract contact candidates from email headers (To, From, CC), calendar attendees, signature blocks
2. Deduplicate: match on email address, then name
3. Classify: client / supplier / partner / authority / personal / unknown
4. Enrich: map to company, role, last contact date, channel
5. Export: structured CSV for CRM or address book import

### Output

- `/data/exports/contacts/[YYYY-MM-DD]-contact-export.csv`
- `/data/reports/contacts/[YYYY-MM-DD]-contact-audit.md`

---

## Module 4 — Finance Assistant

**Spec:** `finance/FINANCE_ASSISTANT_SPEC.md`  
**Data model:** `finance/FINANCE_DATA_MODEL.md`  
**Risk logic:** `finance/FINANCE_RISK_LOGIC.md`  
**Pareto model:** `finance/FINANCE_PARETO_MODEL.md`

### Data sources (read-only)

- Emails containing: invoice, rechnung, mahnung, zahlungserinnerung, fälligkeit, lastschrift, subscription
- Calendar events containing payment-related keywords
- File scan output from W-11 (if finance documents found)

### Processing pipeline

1. Extract: identify finance-relevant items from triage output
2. Classify: type (invoice / reminder / subscription / unknown), direction (payable / receivable)
3. Risk-score: overdue / due soon / on track / unknown
4. Pareto: rank by financial impact
5. Summarise: daily briefing finance section + standalone report

### Output

- Finance section in daily briefing
- `/data/drafts/reports/finance/[YYYY-MM-DD]-finance-summary.md`

---

## Module 5 — Calendar and Call Prep

**Agent:** A-10 (Calendar and Scheduling Agent)

### What it produces

- Today's schedule with lead time and prep flags
- Conflict detection (overlapping events, back-to-back)
- Call preparation notes: context from email history for each attendee
- Upcoming week overview (published Monday morning)

---

## Module 6 — Signatures

**Files:** `signatures/WAVEBITE_SIGNATURE.html`, `signatures/PRIVATE_SIGNATURE.html`

Standard HTML signatures for use in Outlook. Operator copies content into Outlook signature settings manually. No automation.

---

## Integration with Orchestrator_main

| Module | Maps to | Trigger |
|--------|---------|---------|
| Daily briefing | W-08, A-11 | Morning schedule or manual |
| Email triage | W-09, A-09 | On new email batch or manual |
| Calendar | W-09, A-10 | Daily or on calendar change |
| Finance | W-12, A-13 | Daily or on invoice detection |
| File hygiene | W-11, A-14 | On local scan completion |
| Contact export | W-12 output | On operator request |

---

## Future Automation Targets (Phase 3+)

These are planning items only — not currently active:

- Outlook Graph API integration for live email access (requires formal approval)
- Automated finance data pull from banking or invoicing system (requires formal approval)
- CRM sync for contact export (requires formal approval)
- Scheduled daily briefing trigger via GitHub Actions

---

*References: `SYSTEM_SCOPE.md`, `IMPLEMENTATION_PHASES.md`, `briefing/BRIEFING_EXPANSION_PLAN.md`*
