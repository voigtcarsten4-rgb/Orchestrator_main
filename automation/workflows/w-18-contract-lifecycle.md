# Workflow W-18: Contract Lifecycle

**ID:** W-18
**Status:** Active — high-risk, draft-only
**Primary Agent:** A-21 Legal and Contract Agent
**Trigger:** Sales hand-off requesting a contract, inbound contract received, or human request

---

## Purpose

Prepare contract drafts from approved templates, compare incoming contracts against the clause library, and track signature status. The agent never sends and never signs.

---

## Trigger Conditions

- T-01-15 — Human requests a legal task (`requires_approval: true`)
- T-03-12 — Weekly signature status schedule (when enabled)
- T-04-10 — A-17 emits a contract-request handoff
- Inbound contract dropped into `/data/raw/legal/inbound/`

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Confirm task type (draft / compare / status / inbound memo) | A-01 | Request | Scope definition | None |
| 2 | A-01 routes to A-21 | A-01 | Scope | Task assignment | None |
| 3 | A-21 loads approved templates and clause library | A-21 | `/data/reference/legal/` | Working set | None |
| 4 | If draft: A-21 fills template with provided variables; flags unused variables | A-21 | Template + variables | Draft contract | None |
| 5 | If compare: A-21 maps inbound clauses to library, flags new / material deviations | A-21 | Inbound contract + library | Comparison table | None |
| 6 | If status: A-21 reads sign connector and lists in-flight documents | A-21 | Sign connector (read-only) | Status report | None |
| 7 | If inbound memo: A-21 produces plain-English summary | A-21 | Inbound contract | Memo | None |
| 8 | Human reviews drafts and comparisons | Human | Drafts | Approval / revision | **GATE** |
| 9 | If send is required: human authorizes per document | Human | Approved draft | Send authorization | **ELEVATED GATE per document** |
| 10 | Human (or human-led action) sends the document | Human | Approved + authorized doc | Outbound send | Post-approval |
| 11 | A-21 records dispatch in status report post-fact | A-21 | Confirmation | Updated status | Post-approval |

---

## Required Inputs

- Approved templates: `/data/reference/legal/templates/`
- Approved clause library: `/data/reference/legal/clauses/`
- Variables (from A-17 or human)
- Inbound contracts in `/data/raw/legal/inbound/`

---

## Outputs

- Draft contract: `/data/drafts/legal/[counterparty]-[YYYY-MM-DD]-draft.md`
- Clause comparison: `/data/drafts/legal/[counterparty]-[YYYY-MM-DD]-clause-comparison.md`
- Signature status: `/data/drafts/legal/[YYYY-MM-DD]-signature-status.md`
- Inbound memo: `/data/drafts/legal/[counterparty]-[YYYY-MM-DD]-inbound-memo.md`
- Handoff: `/automation/handoffs/W-18-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|------------------|--------------|-----------------|-------|
| Step 8 | Drafts and comparisons | Human operator | Any send / library change | GATE |
| Step 9 | Per-document send | Human operator | Outbound dispatch | ELEVATED |

---

## Failure / Escalation

- Counterparty introduces a clause not in library: flag `[NEW CLAUSE — COUNSEL REVIEW]`, escalate
- Material commercial deviation from agreed terms: flag `[COMMERCIAL DEVIATION]`, escalate to A-17 + human
- Time-sensitive contract approaching expiry: flag `[URGENT — DEADLINE]`

---

## Prompt File

[/automation/prompts/workflows/w-18-contract-lifecycle-prompt.md](../prompts/workflows/w-18-contract-lifecycle-prompt.md)
