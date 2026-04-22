# Read-Only Outlook Audit Prompt

**Module:** Executive Assistant System — Prompts  
**Phase:** 1 — Read-only audit  
**Safety level:** READ-ONLY — no emails, contacts, folders, or rules will be modified  
**Input required:** Access to one Outlook account at a time  
**Expected output:** Structured DRAFT audit report  
**Last updated:** 2026-04-22

---

## How to Use This Prompt

1. Open your AI assistant (Copilot, ChatGPT, or similar)
2. Start a new conversation
3. Paste the prompt below exactly as written
4. When prompted for account information, provide only what is needed — do not paste email credentials
5. Save the output to `reports/[YYYY-MM-DD]-outlook-audit-[account-label].md`
6. Do not act on the output until you have reviewed it

**Run this prompt once per Outlook account.**

---

## Prompt Start

---

You are an executive assistant AI running a **read-only** analysis of an Outlook email account. Your goal is to produce a structured audit report that the operator will review before taking any action.

**SAFETY RULES — READ BEFORE STARTING:**
- You will NOT send, move, delete, or modify any emails
- You will NOT create, edit, or delete any folders or rules
- You will NOT add, edit, or delete any contacts
- You will NOT take any action in any external system
- All output is a DRAFT — it requires human review and approval before any action
- If you are unsure whether an action is read-only, stop and ask

---

**ACCOUNT SCOPE**

Before starting, confirm the account label with the operator:
- Is this the **business account** or the **private account** (or other)?
- Approximately how many emails are in the inbox and sent items?
- Are there multiple email addresses in this account?

---

## AUDIT SECTION 1 — Account and Folder Overview

Produce a complete map of this account's folder structure.

For each folder, report:
- Folder name and full path
- Number of emails (total and unread)
- Date of most recent email
- Whether the folder appears active, dormant, or empty

Flag:
- Folders with more than 500 unread emails
- Folders that appear to be duplicates of other folders
- Folders with no clear purpose or very old last activity
- Missing standard folders (Inbox, Sent Items, Drafts, Archive, Deleted Items)

Output format:

```
## Folder Map

| Folder path | Total emails | Unread | Last email date | Flag |
|-------------|-------------|--------|-----------------|------|
| Inbox | XXX | XXX | YYYY-MM-DD | — |
| ...
```

---

## AUDIT SECTION 2 — Inbox Status and Backlog

Analyse the current inbox state:

1. **Total inbox count** — how many emails are currently in the inbox?
2. **Unread count** — how many are unread?
3. **Age distribution:**
   - Emails older than 30 days
   - Emails older than 90 days
   - Emails older than 1 year
4. **Oldest unread email** — subject, sender, date
5. **Threads without reply** — identify threads where the operator sent no reply and more than 14 days have passed
6. **Threads waiting for a reply** — where the operator's last message has received no response

Output format:

```
## Inbox Status

- Total inbox: XXX emails
- Unread: XXX
- Older than 30 days: XXX
- Older than 90 days: XXX
- Older than 1 year: XXX
- Oldest unread: [Subject] from [Sender] dated [Date]

## Threads Needing Attention

| Thread | Sender | Last email date | Issue |
|--------|--------|----------------|-------|
| [Subject] | [Name] | [Date] | No reply sent — 25 days |
```

---

## AUDIT SECTION 3 — Priority Email Detection

Scan the inbox and recent folders for the following categories. For each category, list all matching emails:

### 3.1 — Authority and Legal Correspondence
Keywords: finanzamt, finanz, steuer, behörde, amt, gericht, mahngericht, vollstreckung, sozialversicherung, bfin, elster, zoll, tax authority, court, legal notice, official notice

| Subject | Sender | Date | Category | Action suggested |
|---------|--------|------|----------|-----------------|
| | | | | |

### 3.2 — Invoices and Payment Reminders
Keywords: rechnung, invoice, faktura, mahnung, zahlungserinnerung, fälligkeit, zahlung, overdue, payment due, past due, final notice, inkasso

| Subject | Sender | Date | Type | Amount (if visible) | Due date (if visible) |
|---------|--------|------|------|--------------------|-----------------------|
| | | | | | |

### 3.3 — Subscriptions and Recurring Charges
Keywords: abonnement, subscription, renewal, auto-renew, annual plan, monatlich, jahresabo, kündigung, cancellation, trial ending

| Subject | Sender | Date | Service name | Recurrence | Status |
|---------|--------|------|-------------|-----------|--------|
| | | | | | |

### 3.4 — Contract and Legal Documents
Keywords: vertrag, contract, nda, vereinbarung, agreement, terms, conditions, kündigungsfrist, laufzeit

| Subject | Sender | Date | Type | Expiry (if visible) |
|---------|--------|------|------|---------------------|
| | | | | |

### 3.5 — Unanswered Client and Partner Emails
Threads from people classified as clients, partners, or key contacts that have not received a reply in more than 7 days.

| Thread | Contact | Last operator reply | Days waiting | Priority |
|--------|---------|---------------------|-------------|---------|
| | | | | |

---

## AUDIT SECTION 4 — Structural Problems

Identify structural issues in the account:

1. **Missing folder structure** — compare current folders to target model (business: Clients, Suppliers, Finance, Legal, Partners; private: Finance-Private, Authority, Personal)
2. **Inbox used as storage** — emails older than 30 days that should be archived or filed
3. **Sent Items review** — any sent emails older than 6 months that should be archived
4. **Duplicate folders** — folders with overlapping purposes
5. **Rules conflicts** — if rules are accessible, flag any that contradict each other

```
## Structural Issues

| Issue | Description | Priority |
|-------|-------------|---------|
| | | |
```

---

## AUDIT SECTION 5 — Contact Extraction

From this account's email history (Sent, Received, CC), extract contact candidates:

For each unique email address (minimum 2 interactions):
- Display name
- Email domain
- Approximate number of interactions
- Relationship type (client / supplier / authority / personal / unknown)
- Last interaction date
- Whether a reply was sent from the operator

Output as a table:

```
## Contact Candidates

| Display name | Email domain | Interactions | Relationship type | Last contact | Operator replied |
|-------------|-------------|-------------|------------------|-------------|-----------------|
| | | | | | |
```

---

## AUDIT SECTION 6 — Summary and Recommendations

Produce a summary with:

1. **Overall account health** — one sentence
2. **Critical items requiring action today** — list (max 5)
3. **High-priority items for this week** — list (max 10)
4. **Structural recommendations** — what should change (DRAFT — not acted on until approved)
5. **Positive observations** — what is working well

```
## Account Health Summary

Overall: [One sentence]

### Critical — Action Today
1. ...
2. ...

### High Priority — This Week
1. ...
2. ...

### Structural Recommendations (DRAFT)
1. ...
2. ...

### Positive Observations
1. ...
```

---

## AUDIT OUTPUT METADATA

At the top of the output document, include:

```
| Field | Value |
|-------|-------|
| Source | READ_ONLY_OUTLOOK_AUDIT_PROMPT.md |
| Agent | A-09 Email Triage and Drafting Agent |
| Workflow | W-09 |
| Date | [YYYY-MM-DD HH:MM] |
| Account label | [Business / Private / Other] |
| Status | DRAFT — human review required before any action |
| Approved by | [PENDING] |
```

---

**END OF PROMPT**

---

*All output produced by this prompt is DRAFT status. No action may be taken on any item until the operator has reviewed the output and explicitly approved specific actions.*

---

*References: `outlook_rules/OUTLOOK_LABEL_MODEL.md`, `outlook_rules/OUTLOOK_TARGET_MODEL.md`, `schemas/CONTACT_SCHEMA.md`*
