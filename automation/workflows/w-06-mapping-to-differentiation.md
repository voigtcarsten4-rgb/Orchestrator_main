# Workflow W-06: App Mapping to Differentiation Planning

**ID:** W-06  
**Status:** Active  
**Primary Agent:** A-06 App Differentiation Agent  
**Trigger:** W-05 complete and human approval recorded

---

## Purpose

Derive a differentiated app variant from the base application reference and the approved app mapping. Define all content and structural changes required, produce a variant summary, and flag downstream asset and copy needs.

---

## Trigger Conditions

- W-05 complete AND human approval recorded (T-04-03)

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | A-01 confirms W-05 approval and confirms base app reference is available | A-01 | W-05 handoff + base app ref | Task assignment | None |
| 2 | Identify differentiation axes (audience, focus, tone, function) | A-06 | App map + base app | Differentiation axes | None |
| 3 | Produce per-screen change matrix | A-06 | Axes + app map | Differentiation plan | None |
| 4 | Produce variant summary (audience, key differentiators, scope) | A-06 | Differentiation plan | Variant summary | None |
| 5 | Flag asset needs for A-07 and copy needs for A-08 | A-06 | Differentiation plan | Asset + copy flags | None |
| 6 | Human reviews differentiation plan and variant summary | Human | All outputs | **Elevated approval** | **ELEVATED GATE** |

---

## Required Inputs

- App map: `/data/mapped/[project-id]/[YYYY-MM-DD]-app-map.md`
- Base app reference (human-provided or from `/data/reference/`)
- W-05 handoff with human approval

---

## Change Types Used in Differentiation Plan

`[COPY-CHANGE]` | `[CONTENT-SWAP]` | `[NEW-SECTION]` | `[REMOVED]` | `[REORDERED]`

---

## Outputs

- Differentiation plan: `/data/normalized/[project-id]/[YYYY-MM-DD]-differentiation-plan.md`
- Variant summary: `/data/normalized/[project-id]/[YYYY-MM-DD]-variant-summary.md`
- Handoff file: `/automation/handoffs/W-06-[YYYY-MM-DD]-[project-id].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before | Level |
|------|-----------------|--------------|-----------------|-------|
| Step 6 | Full differentiation plan, variant summary, all change flags | Human operator | W-07 begins | ELEVATED — active decision required |

---

## Why Elevated Approval

Differentiation changes affect downstream app structure, content, and assets. A mistake here propagates through the entire content and asset pipeline. The human operator must make an active, deliberate decision — not just a passive review.

---

## Failure / Escalation

- Base app reference is missing or outdated: block, escalate to human to provide reference
- Differentiation scope is unclear or contradictory: surface conflict, request human clarification
- Differentiation would require changes outside defined scope: flag and escalate before proceeding

---

## Chaining

W-06 complete + human elevated approval → A-01 activates W-07 with parallel assignment to A-07 and A-08 (T-04-04)

---

## Prompt File

[/automation/prompts/workflows/w-06-mapping-to-differentiation-prompt.md](../prompts/workflows/w-06-mapping-to-differentiation-prompt.md)
