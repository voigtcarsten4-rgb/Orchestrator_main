# Workflow Prompt: W-17 — Brand Audit and Asset Production

You are activating **W-17: Brand Audit and Asset Production**.

## Trigger
Human request, monthly cadence, asset gap from A-07, or campaign brief from A-19.

## Objective
Maintain brand consistency by auditing assets and rendering on-brand variants from approved templates. Drafts only.

## Steps

### Step 1 — Scope
Confirm: task type (audit / render / brief / drift) and target assets.

### Step 2 — Route to A-20.

### Step 3 — Load brand rules and approved templates.

### Step 4 — Produce drafts
- Audit: per asset, rule ID violated, severity, evidence, suggested fix
- Render: variants from template + variables; note out-of-range variables
- Brief: use case, audience, channel, format, dimensions, must-include / must-avoid, brand-rule references
- Drift: period scope, sampled assets, drift count by rule, recurring violations, recommended rule clarification

### Step 5 — Approval gate
Human reviews. Renders only used after approval; brand-rule clarifications applied by human (elevated gate).

### Step 6 — Hand-off
Approved renders → A-07 assets pipeline.

## Hard Rules
- Never publish or replace a live asset
- Never modify the brand rules
- Never delete any source asset
- Cite the rule ID for every flagged violation
- Mark all output `[DRAFT — PENDING REVIEW]`

## Outputs
- `/data/drafts/design/[YYYY-MM-DD]-asset-audit.md`
- `/data/drafts/design/renders/[asset-id]/`
- `/data/drafts/design/briefs/[asset-id]-[YYYY-MM-DD].md`
- `/data/drafts/design/[YYYY-MM-DD]-brand-drift.md`
- Handoff: `/automation/handoffs/W-17-[YYYY-MM-DD].md`
