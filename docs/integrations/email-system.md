# Email System Integration

**Document:** `/docs/integrations/email-system.md`
**Version:** 1.0
**Date:** 2026-04-21
**Owner:** Integration Planning Agent (A-15)
**Status:** Planned — not active

---

## 1. Overview

This document defines the planned integration between the Orchestrator_main system and the email accounts used for personal, Wave Bite, and Himmelreich operations.

The integration enables structured email batches to be ingested for triage, classification, and draft response preparation by Agent A-09.

Email sending remains exclusively a human action. This system never sends email.

---

## 2. Purpose

| Purpose | Description |
|---------|-------------|
| Email ingestion | Read and batch incoming emails for structured triage |
| Classification support | Provide metadata (sender, subject, date, thread) to A-09 for accurate classification |
| Draft response preparation | Enable A-09 to produce accurate draft responses based on full email context |
| Scheduling detection | Surface scheduling-relevant emails for handoff to A-10 |

---

## 3. Email Accounts in Scope

| Account | Type | Purpose |
|---------|------|---------|
| Personal inbox | Personal | Daily communications, personal tasks |
| Wave Bite operations | Business | Customer inquiries, partner comms, app ops |
| Himmelreich venue | Business | Booking requests, event inquiries, vendor comms |

---

## 4. Data Flows

### Inbound (Email → Orchestrator_main)

| Data Type | Method | Destination in System | Agent |
|-----------|--------|----------------------|-------|
| Email batch (manual export) | Operator exports batch to markdown | `/data/inbox/email/[date]-email-batch.md` | A-09 |
| Email batch (API integration) | Integration reads inbox, creates batch file | `/data/inbox/email/[date]-email-batch.md` | A-09 |
| Attachment files | Operator exports separately | `/data/inbox/attachments/` | A-09 |

### Outbound (Orchestrator_main → Email System)

| Data Type | Source in System | Action | Approval Required |
|-----------|-----------------|--------|------------------|
| Draft responses | `/data/drafts/[date]-email-drafts.md` | Operator copies and sends manually | Yes — per email |
| Draft follow-ups | `/data/drafts/[date]-follow-up-drafts.md` | Operator copies and sends manually | Yes — per email |

**The system never sends email. All sending is performed manually by the human operator.**

---

## 5. Automation Triggers

| Trigger | Description | Status |
|---------|-------------|--------|
| Email batch placed in inbox | When operator places batch file, A-09 is activated for triage | Available — manual trigger |
| Scheduled email review | Periodic triage run triggered automatically | Planned — requires trigger activation |

---

## 6. Activation Requirements

Before live email API integration is activated:

- [ ] Email provider API type identified (Gmail API, Microsoft Graph, IMAP, etc.)
- [ ] OAuth credentials or API keys stored securely — never in this repository
- [ ] Read-only inbox access scope defined — no write permissions at activation
- [ ] Batch size limits configured (max 100 emails per run per `/config/system.yaml`)
- [ ] PII handling rules reviewed and confirmed
- [ ] Test run performed with a sample inbox against staging environment
- [ ] Rollback plan defined
- [ ] Integration configuration stored in `/config/integrations/email-system.yaml`
- [ ] A-15 has produced a full integration specification

---

## 7. Security and Privacy Rules

| Rule | Description |
|------|-------------|
| No credentials in repository | API keys, OAuth tokens, passwords never stored here |
| Read-only by default | Integration never writes to inbox, never marks as read automatically |
| No auto-forwarding | System does not forward any email content to external systems |
| PII handling | Email content processed locally; not sent to third-party services |
| Batch scope control | Operator defines inbox scope — no blanket inbox access |
| Draft isolation | Draft responses stored in `/data/drafts/` — never injected into email system |

---

## 8. Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Credentials exposed | Critical | Stored only in external secrets manager; rotated on any suspected compromise |
| Inadvertent email send | Critical | System has no send permission; operator sends manually |
| PII leakage | High | Processing is local; batch files are not shared externally |
| Over-broad inbox access | High | Scope explicitly limited at API authorization step |
| Classification error triggering wrong draft | Medium | All drafts reviewed and approved by operator before use |

---

## 9. Manual Fallback (Current Operating Mode)

Until the live integration is activated, the email workflow operates in manual mode:

1. Operator exports email batch as a formatted markdown file
2. File is placed in `/data/inbox/email/[YYYY-MM-DD]-email-batch.md`
3. Operator asks A-09 to triage the batch
4. A-09 processes the batch and produces triage report and drafts
5. Operator reviews and acts

This manual mode is fully functional and requires no integration to operate.

---

## 10. Related Documents

| Document | Path |
|----------|------|
| Integration roadmap | `/docs/integrations/integration-roadmap.md` |
| Email Triage and Drafting Agent | `/automation/agents/email-triage-agent.md` |
| Calendar and Scheduling Agent | `/automation/agents/calendar-scheduling-agent.md` |
| W-09 Email to Calendar and Follow-up | `/automation/workflows/w-09-email-to-calendar.md` |
