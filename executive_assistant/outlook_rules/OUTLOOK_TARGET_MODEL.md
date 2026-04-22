# Outlook Target Model

**Module:** Executive Assistant System  
**Document type:** Target folder structure and routing model  
**Last updated:** 2026-04-22  
**Status:** DRAFT — for operator review before any folder changes are made

---

## Design Principles

1. **Inbox is a processing queue** — not a storage location. An email in the inbox has not yet been triaged.
2. **Every folder serves a purpose** — no orphaned or duplicate folders.
3. **Deep nesting is avoided** — maximum 2 levels below Inbox.
4. **Business and private are structurally separated** — different account roots or top-level folder prefixes.
5. **Finance and legal get their own top-level folders** — these are high-priority retrieval categories.
6. **Archive is separate from active folders** — old material does not pollute current working view.

---

## Target Folder Structure — Business Account

```
📁 Inbox                    ← Processing queue only
📁 _ACTION                  ← Emails requiring action (consolidated view)
📁 _WAITING                 ← Sent items awaiting reply
📁 Clients
    ├── [Client A]
    ├── [Client B]
    └── _General
📁 Suppliers
    ├── [Supplier A]
    └── _General
📁 Finance
    ├── Invoices-Inbound
    ├── Invoices-Outbound
    ├── Payment-Reminders
    └── Subscriptions
📁 Legal
    ├── Contracts
    ├── Authority-Correspondence
    └── Disputes
📁 Partners
📁 Internal
📁 Projects
    ├── [Project A]
    └── [Project B]
📁 Newsletters               ← Low priority — review monthly
📁 _Archive
    ├── [YYYY]
    │   ├── Clients
    │   ├── Finance
    │   └── _General
📁 Sent Items               ← Standard Outlook sent folder
📁 Drafts                   ← Standard Outlook drafts folder
```

---

## Target Folder Structure — Private Account

```
📁 Inbox                    ← Processing queue only
📁 _ACTION
📁 _WAITING
📁 Personal
    ├── Family
    └── Friends
📁 Finance-Private
    ├── Banking
    ├── Insurance
    ├── Taxes
    └── Subscriptions
📁 Authority
    ├── Tax-Office
    ├── Social-Insurance
    └── Government
📁 Purchases                ← Online orders, confirmations
📁 Travel
📁 Health
📁 Newsletters
📁 _Archive
    ├── [YYYY]
```

---

## Folder Naming Conventions

| Rule | Example |
|------|---------|
| Start with underscore for system/utility folders | `_ACTION`, `_WAITING`, `_Archive` |
| Use PascalCase for content folders | `Clients`, `Finance`, `Legal` |
| Use hyphens for sub-folder specificity | `Invoices-Inbound`, `Tax-Office` |
| Year-based archive sub-folders | `_Archive/2024`, `_Archive/2025` |
| No spaces in folder names | ✅ `Payment-Reminders` ❌ `Payment Reminders` |

---

## Routing Rules — Logic

The following rules define how incoming emails should be automatically routed by Outlook rules:

| Condition | Action |
|-----------|--------|
| From known client domain | Move to `Clients/[Client Name]` |
| From known supplier domain | Move to `Suppliers/[Supplier Name]` |
| Subject contains: rechnung, invoice, faktura | Label `INVOICE-INBOUND` + move to `Finance/Invoices-Inbound` |
| Subject contains: mahnung, reminder, zahlungserinnerung | Label `PAYMENT-REMINDER` + move to `Finance/Payment-Reminders` |
| From known authority domain (.gv.at, .bund.de, .finanzamt.) | Label `AUTHORITY` + move to `Legal/Authority-Correspondence` |
| Newsletter subscription headers present | Move to `Newsletters` |
| Unsubscribe link in body + no direct address | Move to `Newsletters` |
| From self (monitoring alerts, system emails) | Move to `Internal` |

**Important:** Rules are DRAFT. The operator must review and approve each rule before it is created in Outlook.

---

## Migration Strategy

Phase 1: Audit current folder structure — produce a map (no changes)  
Phase 2: Create target folder structure in parallel — do not delete old folders yet  
Phase 3: Move emails to new structure in batches — operator approves each batch  
Phase 4: Remove old empty folders — operator approves each deletion  
Phase 5: Activate routing rules — test with one rule at a time

---

*References: `OUTLOOK_LABEL_MODEL.md`, `prompts/READ_ONLY_OUTLOOK_AUDIT_PROMPT.md`*
