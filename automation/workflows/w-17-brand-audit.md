# Workflow W-17: Brand Audit and Asset Production

**ID:** W-17
**Status:** Active
**Primary Agent:** A-20 Design and Brand Agent
**Trigger:** Monthly cadence, asset gap from A-07, campaign brief from A-19, or human request

---

## Purpose

Maintain brand consistency by auditing existing assets and rendering on-brand variants from approved templates. Drafts only; live assets are never replaced without human approval.

---

## Trigger Conditions

- T-01-14 — Human requests a design task
- T-03-11 — Monthly brand audit schedule (when enabled)
- A-07 surfaces an asset gap
- A-19 surfaces a campaign asset need

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Confirm task type (audit / render / brief / drift) and scope | A-01 | Request | Scope definition | None |
| 2 | A-01 routes to A-20 | A-01 | Scope | Task assignment | None |
| 3 | A-20 loads brand rules and approved templates | A-20 | `/data/reference/brand/` | Working set | None |
| 4 | If audit: A-20 inspects sampled assets against rules | A-20 | Asset list + rules | Violation list | None |
| 5 | If render: A-20 produces variants from template + variables | A-20 | Template + variables | Render set | None |
| 6 | If brief: A-20 writes brief from upstream input (A-07 / A-19) | A-20 | Upstream brief | Design brief | None |
| 7 | If drift: A-20 produces drift report with rule recommendations (does not apply) | A-20 | Period sample | Drift report | None |
| 8 | A-20 consolidates output and labels each item | A-20 | All sections | Output draft | None |
| 9 | Human reviews drafts | Human | Drafts | Approval / revision | **GATE** |
| 10 | Approved renders promoted to assets pipeline | A-07 / Human | Approved renders | Asset packet | Post-approval |
| 11 | Approved brand-rule clarifications updated by human | Human | Recommendation | Brand-rule update | **ELEVATED GATE** |

---

## Required Inputs

- Brand rules: `/data/reference/brand/`
- Approved templates: `/data/reference/templates/`
- Source assets in `/data/raw/` or DAM
- Upstream briefs from A-07 or A-19

---

## Outputs

- Asset audit: `/data/drafts/design/[YYYY-MM-DD]-asset-audit.md`
- Renders: `/data/drafts/design/renders/[asset-id]/`
- Briefs: `/data/drafts/design/briefs/[asset-id]-[YYYY-MM-DD].md`
- Brand drift: `/data/drafts/design/[YYYY-MM-DD]-brand-drift.md`
- Handoff: `/automation/handoffs/W-17-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|------------------|--------------|-----------------|-------|
| Step 9 | Drafts, audits, renders | Human operator | Asset use | GATE |
| Step 11 | Brand-rule change | Human operator | Rule update applied | ELEVATED |

---

## Failure / Escalation

- Source asset missing license / rights: stop, flag `[RIGHTS MISSING]`, escalate
- Template unable to satisfy variables (out-of-range): flag `[TEMPLATE LIMIT]`, request human input
- Drift exceeds tolerance: flag `[BRAND DRIFT — REVIEW REQUIRED]`

---

## Prompt File

[/automation/prompts/workflows/w-17-brand-audit-prompt.md](../prompts/workflows/w-17-brand-audit-prompt.md)
