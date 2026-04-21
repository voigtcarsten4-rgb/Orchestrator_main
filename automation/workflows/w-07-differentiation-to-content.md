# Workflow W-07: Differentiation Planning to Content and Asset Preparation

**ID:** W-07  
**Status:** Active  
**Primary Agents:** A-07 Asset and Image Planning Agent + A-08 Content Generation Agent (parallel)  
**Trigger:** W-06 complete and human elevated approval recorded

---

## Purpose

Produce all content drafts and asset plans required to build the differentiated app variant. A-07 (asset planning) and A-08 (content generation) operate in parallel to maximise efficiency. All outputs are drafts pending human review.

---

## Trigger Conditions

- W-06 complete AND human elevated approval recorded (T-04-04)

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | A-01 confirms W-06 elevated approval | A-01 | W-06 handoff | — | None |
| 2a | Asset inventory and gap analysis (parallel) | A-07 | Differentiation plan + media inventory | Asset inventory + gaps | None |
| 2b | Content draft generation (parallel) | A-08 | Differentiation plan + normalized data | Content drafts | None |
| 3a | Asset brief production | A-07 | Asset gaps | Asset briefs | None |
| 3b | CTA, FAQ, and alt text generation | A-08 | Asset briefs from A-07 | CTA list, FAQ draft, alt text | None |
| 4 | A-01 verifies both parallel tracks are complete | A-01 | Both handoffs | Integration check | None |
| 5 | Human reviews all content drafts and asset briefs | Human | All draft outputs | Approval / revision requests | **GATE** |

---

## Required Inputs

- Differentiation plan: `/data/normalized/[project-id]/[YYYY-MM-DD]-differentiation-plan.md`
- Variant summary: `/data/normalized/[project-id]/[YYYY-MM-DD]-variant-summary.md`
- Media inventory: `/data/raw/[project-id]/[YYYY-MM-DD]-media-inventory.md`
- Normalized content: `/data/normalized/[project-id]/`
- Tone and style instructions (from project brief or human)
- W-06 handoff with elevated approval

---

## Parallel Execution

A-07 and A-08 run simultaneously. A-08 uses A-07 asset briefs for alt text generation — if A-07 completes first, A-08 integrates the briefs. If A-08 completes first, A-08 marks alt text as `[PENDING-ASSET-BRIEF]` and updates when A-07 briefs arrive.

---

## Outputs

**A-07 outputs:**
- `/data/drafts/assets/[project-id]/[YYYY-MM-DD]-asset-inventory.md`
- `/data/drafts/assets/[project-id]/[YYYY-MM-DD]-asset-gaps.md`
- `/data/drafts/assets/[project-id]/[YYYY-MM-DD]-asset-briefs.md`

**A-08 outputs:**
- `/data/drafts/content/[project-id]/[YYYY-MM-DD]-content-draft.md`
- `/data/drafts/content/[project-id]/[YYYY-MM-DD]-cta-inventory.md`
- `/data/drafts/content/[project-id]/[YYYY-MM-DD]-faq-draft.md`
- `/data/drafts/content/[project-id]/[YYYY-MM-DD]-alt-text.md`

**Handoff:** `/automation/handoffs/W-07-[YYYY-MM-DD]-[project-id].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before |
|------|-----------------|--------------|-----------------|
| Step 5 | All content drafts and asset briefs | Human operator | Any content or asset is used/exported |

---

## Failure / Escalation

- Source data insufficient for content generation: A-08 flags specific sections, production pauses pending human input
- Asset brief cannot be produced without more context: A-07 flags and requests human guidance
- One parallel track fails: A-01 halts the other, escalates to human

---

## Chaining

W-07 complete + human approval → content ready for:
- Export to `/data/exports/[project-id]/`
- LinkedIn/communication adaptation via W-10

---

## Prompt File

[/automation/prompts/workflows/w-07-differentiation-to-content-prompt.md](../prompts/workflows/w-07-differentiation-to-content-prompt.md)
