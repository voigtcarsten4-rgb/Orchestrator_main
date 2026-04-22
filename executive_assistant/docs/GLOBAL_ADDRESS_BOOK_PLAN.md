# Global Address Book Plan

**Module:** Executive Assistant System  
**Document type:** Contact management plan  
**Last updated:** 2026-04-22

---

## Objective

Establish a clean, structured global address book by extracting contacts from existing Outlook accounts, deduplicating and classifying them, and producing a validated export ready for import into Outlook Contacts, a CRM, or another address book system.

No contact is created, modified, or deleted in any live system without operator approval.

---

## Current State Assessment

Before extraction begins, the operator should note:

- How many Outlook accounts are in scope (business + private)
- Whether a CRM is already in use and whether it should receive the export
- Whether existing contacts in Outlook are trusted, stale, or a mix
- Whether there are duplicate accounts for the same person

---

## Contact Sources — In Priority Order

| Source | Expected yield | Notes |
|--------|---------------|-------|
| Sent Items (To/CC fields) | High — these are active relationships | Most reliable signal of real contact |
| Received emails (From field) | High — includes suppliers, clients, authorities | May include newsletter senders |
| Calendar attendees | Medium — business contacts | High quality for business relationships |
| Email signature blocks | Medium — structured contact data | Requires signature parsing |
| Existing Outlook contacts | Depends on current hygiene | May contain duplicates or stale entries |

---

## Extraction Process

### Step 1 — Raw extraction

For each email account:
- Export a list of unique email addresses from: Sent Items (last 2 years), Received (last 2 years), Calendar attendees
- For each address, capture: email, display name (as seen in header), domain, first/last seen date
- Do not read email body content — headers only

### Step 2 — Deduplication

- Match on email address (exact match)
- For addresses with multiple display names, flag for operator review
- Identify corporate aliases pointing to the same person (e.g. firstname@ and firstname.lastname@)

### Step 3 — Classification

Apply the relationship type taxonomy:

| Type | Definition |
|------|-----------|
| `client` | Person or company that pays for services |
| `supplier` | Person or company providing goods or services |
| `partner` | Strategic or collaborative relationship |
| `authority` | Government, tax, regulatory, legal body |
| `personal` | Family, friends, private contacts |
| `media` | Press, journalists, social channels |
| `unknown` | Insufficient data to classify |

Classification can be operator-guided: provide a list of known domains mapped to types (e.g. `finanzamt.de` → `authority`).

### Step 4 — Enrichment (optional)

For key contacts, add:
- Company name
- Role / title (if known from signature or email context)
- Phone number (if extractable from signature)
- LinkedIn URL (if known)
- Tags (e.g. `key-client`, `board`, `investor`)

### Step 5 — Export

Export to `templates/CONTACT_EXPORT_TEMPLATE.csv` format.

Output file: `/data/exports/contacts/[YYYY-MM-DD]-contact-export.csv`  
Audit report: `/data/reports/contacts/[YYYY-MM-DD]-contact-audit.md`

---

## Deduplication Rules

| Condition | Action |
|-----------|--------|
| Exact email match | Merge — keep most recent display name |
| Same name, different email | Flag for operator review |
| Same domain, different role indicator | Keep separate, add company link |
| Obvious newsletter / no-reply address | Mark as `exclude` — do not import to address book |
| Distribution list address | Mark as `list` — separate handling |

---

## Import Strategy

Phase 1: Export only — no import to live systems  
Phase 2: Operator reviews export, marks records as approved / rejected  
Phase 3: Import approved records in batches  

Batch size: maximum 100 contacts per import to allow controlled review.

---

## Ongoing Maintenance

After initial import, contacts are maintained by:
- Monthly extraction pass from new emails
- Operator-driven additions for new client and partner relationships
- Annual full deduplication review

---

## Schema Reference

See `schemas/CONTACT_SCHEMA.md` for all field definitions and validation rules.

---

*References: `schemas/CONTACT_SCHEMA.md`, `templates/CONTACT_EXPORT_TEMPLATE.csv`, `TARGET_ARCHITECTURE.md`*
