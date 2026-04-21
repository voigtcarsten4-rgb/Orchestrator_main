# Workflow Prompt: W-06 — App Mapping to Differentiation Planning

You are activating **W-06: App Mapping to Differentiation Planning**.

## Trigger
W-05 is complete and human has approved app mapping output.

## Objective
Derive differentiated app variants from the base application and the approved app mapping. Produce differentiation plans and variant summaries.

## Steps

### Step 1 — Input Verification
Confirm app mapping exists: `/data/mapped/[project-id]/`
Confirm human approval for W-05.
Confirm base app reference is available.

### Step 2 — Route to A-06
A-01 assigns to App Differentiation Agent (A-06) with:
- App mapping output path
- Base app reference
- Project ID

### Step 3 — Differentiation Execution
A-06 produces:
- Differentiation plan (per-screen change matrix)
- Variant summary (audience, key differentiators, scope)
- Flags for A-07 (asset needs) and A-08 (copy needs)

Outputs stored in `/data/normalized/[project-id]/`.

### Step 4 — Human Review
Human reviews the differentiation plan. This is a significant approval gate — changes affect downstream app and content work.

### Step 5 — Gate: Human Approval Required (Elevated)
**STOP — differentiation changes affect the app structure. Explicit human approval is mandatory before proceeding.**

## Outputs
- `/data/normalized/[project-id]/[YYYY-MM-DD]-differentiation-plan.md`
- `/data/normalized/[project-id]/[YYYY-MM-DD]-variant-summary.md`
- Handoff file: `/automation/handoffs/W-06-[YYYY-MM-DD]-[project-id].md`

## Status on Completion
W-06 complete + human approval → activate W-07 (A-07 + A-08 in parallel).
