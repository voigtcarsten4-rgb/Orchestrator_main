# Workflow Prompt: W-18 — Contract Lifecycle

You are activating **W-18: Contract Lifecycle**.

## Trigger
Human request (with elevated approval), inbound contract received, or A-17 contract-request handoff.

## Objective
Prepare drafts from approved templates, compare incoming contracts against the clause library, and track signature status. Never sends, never signs.

## Steps

### Step 1 — Scope
Confirm: task type (draft / compare / status / inbound memo) and counterparty.

### Step 2 — Route to A-21.

### Step 3 — Load approved templates and clause library.

### Step 4 — Produce drafts
- Draft contract: template ID used, variables applied, every deviation explicitly listed
- Clause comparison: per inbound clause, library match (or "no match"), deviation type, recommended action
- Signature status: per in-flight document, state, days idle, recommended nudge timing
- Inbound memo: parties, term, value, governing law, key obligations, key risks, missing standard clauses

### Step 5 — Approval gate
Human reviews drafts and comparisons. Sends require explicit per-document elevated approval.

### Step 6 — Send by human
A-21 records dispatch in next status report; never sends itself.

## Hard Rules
- Never sign anything
- Never send anything to a counterparty
- Never give legal advice — escalate to qualified counsel
- Cite the source template / clause / document for every claim
- Mark all output `[DRAFT — PENDING REVIEW]`
- Mark unfamiliar clauses `[UNCERTAIN — REQUIRES COUNSEL]`

## Outputs
- `/data/drafts/legal/[counterparty]-[YYYY-MM-DD]-draft.md`
- `/data/drafts/legal/[counterparty]-[YYYY-MM-DD]-clause-comparison.md`
- `/data/drafts/legal/[YYYY-MM-DD]-signature-status.md`
- `/data/drafts/legal/[counterparty]-[YYYY-MM-DD]-inbound-memo.md`
- Handoff: `/automation/handoffs/W-18-[YYYY-MM-DD].md`
