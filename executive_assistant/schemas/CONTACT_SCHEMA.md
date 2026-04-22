# Contact Schema

**Module:** Executive Assistant System  
**Document type:** Data schema  
**Last updated:** 2026-04-22

---

## Purpose

Defines the standard data structure for a contact record as used throughout the Executive Assistant System. All contact exports, imports, and agent outputs must conform to this schema.

---

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contact_id` | string | Yes | Unique identifier — auto-generated (UUID or sequential) |
| `email_primary` | string | Yes | Primary email address — must be unique per record |
| `email_secondary` | string | No | Secondary or alternative email address |
| `display_name` | string | Yes | Full name as it appears in email headers |
| `first_name` | string | No | Given name |
| `last_name` | string | No | Family name |
| `company` | string | No | Organisation or company name |
| `role_title` | string | No | Job title or role |
| `phone_mobile` | string | No | Mobile phone number in international format |
| `phone_office` | string | No | Office or landline number |
| `domain` | string | Yes | Email domain — extracted from primary email |
| `relationship_type` | enum | Yes | See Relationship Types below |
| `account_source` | string | Yes | Which Outlook account this contact was found in |
| `source_type` | enum | Yes | How the contact was discovered |
| `first_seen_date` | date | Yes | Date of first email interaction (`YYYY-MM-DD`) |
| `last_seen_date` | date | Yes | Date of most recent email interaction |
| `interaction_count` | integer | No | Total number of emails exchanged |
| `tags` | list | No | Free-form tags for additional classification |
| `notes` | string | No | Operator notes |
| `status` | enum | Yes | Processing status — see Status Values below |
| `linkedin_url` | string | No | LinkedIn profile URL |
| `website` | string | No | Company or personal website |
| `address_line_1` | string | No | Street address |
| `address_city` | string | No | City |
| `address_country` | string | No | Country (ISO 3166 alpha-2 code) |
| `created_at` | datetime | Yes | Record creation timestamp |
| `updated_at` | datetime | Yes | Last modification timestamp |

---

## Relationship Types

| Value | Meaning |
|-------|---------|
| `client` | Paying client — active or historical |
| `supplier` | Supplier of goods or services |
| `partner` | Strategic or collaborative relationship |
| `authority` | Government, tax, regulatory, legal body |
| `media` | Press, journalist, blogger, social channel |
| `investor` | Investor or potential investor |
| `personal` | Family, friend, personal acquaintance |
| `internal` | Employee or team member |
| `list` | Distribution list or group email address |
| `newsletter` | Newsletter sender — not a direct contact |
| `unknown` | Insufficient data to classify |

---

## Source Types

| Value | Meaning |
|-------|---------|
| `email_sent` | Found in Sent Items |
| `email_received` | Found as sender of received email |
| `email_cc` | Found in CC field |
| `calendar_attendee` | Found as calendar event attendee |
| `signature_extraction` | Parsed from email signature block |
| `manual_entry` | Added directly by operator |
| `existing_contact` | Already in Outlook contacts before extraction |

---

## Status Values

| Value | Meaning |
|-------|---------|
| `candidate` | Extracted — pending operator review |
| `approved` | Operator has approved this record for import |
| `rejected` | Operator has excluded this record |
| `imported` | Successfully imported to address book or CRM |
| `duplicate` | Identified as duplicate — merged or discarded |
| `stale` | No interaction in 24+ months — marked for review |

---

## Validation Rules

- `email_primary` must be a valid email address format
- `domain` must be consistent with `email_primary`
- `first_seen_date` must be ≤ `last_seen_date`
- `relationship_type` must use a value from the enum above
- `status` must use a value from the enum above
- Records with `status: newsletter` or `status: list` are excluded from address book import

---

## CSV Column Order

For `templates/CONTACT_EXPORT_TEMPLATE.csv`:

```
contact_id, email_primary, email_secondary, display_name, first_name, last_name,
company, role_title, phone_mobile, phone_office, domain, relationship_type,
account_source, source_type, first_seen_date, last_seen_date, interaction_count,
tags, notes, status, linkedin_url, website, address_city, address_country
```

---

*References: `docs/GLOBAL_ADDRESS_BOOK_PLAN.md`, `templates/CONTACT_EXPORT_TEMPLATE.csv`*
