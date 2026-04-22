# System Scope

**Module:** Executive Assistant System  
**Document type:** Scope definition  
**Last updated:** 2026-04-22

---

## What This System Is

The Executive Assistant System is a structured AI-support layer for a business owner / CEO operating across multiple domains simultaneously. It does not replace decision-making — it eliminates the administrative overhead that prevents clear thinking and timely action.

It surfaces, organises, and prioritises. The human decides and acts.

---

## In Scope

### 1. Daily CEO Briefing

- Compile a structured morning briefing from all available inputs
- Include schedule, emails, open tasks, finance alerts, risks, and quick wins
- Integrate business and private domains in a single prioritised view
- Flag decision items requiring a response today
- Include Pareto analysis: what is the highest-leverage action right now

### 2. Outlook Account Audit and Structural Improvement

- Read-only analysis of all connected Outlook accounts (business and private)
- Map existing folder structure
- Identify unread backlogs, pending replies, overdue follow-ups
- Detect invoices, reminders, authority correspondence, subscriptions
- Propose folder structure improvements without executing them
- Produce DRAFT output — no emails are sent, moved, or deleted without explicit approval

### 3. Contact Extraction and Global Address Book

- Extract contacts from email history, calendar events, and signature blocks
- Deduplicate and classify by relationship type and domain
- Produce a structured export ready for CRM or address book import
- No contact is created, modified, or deleted in any live system without approval

### 4. Finance Assistant

- Aggregate open invoices, reminders, subscriptions, and direct debits
- Detect overdue positions and approaching due dates
- Classify by risk level: critical / warning / informational
- Apply Pareto logic: identify the 20 % of items driving 80 % of financial risk
- Produce a finance summary for the daily briefing and as a standalone report

### 5. Calendar and Scheduling Support

- Surface today's and this week's appointments
- Flag conflicts, back-to-back meetings, and missing prep time
- Identify cancelled or rescheduled items
- Produce call preparation notes for key meetings

### 6. Email Triage

- Classify incoming emails by priority, type, and required action
- Draft responses for routine replies (DRAFT state — never auto-sent)
- Detect unanswered threads older than configured thresholds
- Flag authority mail, legal notices, and time-critical items

---

## Out of Scope

| Action | Why it is excluded |
|--------|--------------------|
| Sending emails automatically | Live sends require explicit human approval |
| Deleting emails or contacts | Destructive — never automatic |
| Moving emails to folders in bulk | Requires operator approval and structural plan |
| Accessing third-party APIs without consent | No integrations until formally approved |
| Financial transactions or payments | Read-only analysis only |
| Calendar event creation without approval | Draft mode only |
| Accessing file content (not metadata) | Only filenames and metadata may be scanned |

---

## Operational Boundaries

- **No live modifications** until Phase 2 (see `IMPLEMENTATION_PHASES.md`)
- **Read-only** for all Outlook and file system access in Phase 1
- **Draft state** for all generated output until human review
- **No hardcoded credentials** — all account access via operator-configured environment
- **Business and private data treated separately** in storage; combined only in the briefing view

---

## What the Operator Gains

| Problem | What the system provides |
|---------|-------------------------|
| Missed emails and follow-ups | Structured triage with priority flags |
| Unclear financial position | Aggregated open items with risk classification |
| Fragmented daily priorities | Single integrated morning briefing |
| Lost contacts and weak address book | Structured extraction and deduplication |
| Disorganised Outlook | Folder model proposal ready for operator approval |
| No time for call prep | Auto-generated meeting context from emails and calendar |
| Reactive decision-making | Proactive risk and opportunity surfacing every morning |

---

*References: `TARGET_ARCHITECTURE.md`, `IMPLEMENTATION_PHASES.md`, `IMPLEMENTATION_READINESS_CHECKLIST.md`*
