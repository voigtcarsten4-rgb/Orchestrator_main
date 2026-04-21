# Workflow W-10: Communication Draft Preparation

**ID:** W-10  
**Status:** Active  
**Primary Agent:** A-12 LinkedIn and Communication Agent  
**Trigger:** Human requests a communication draft or approved content is ready for adaptation

---

## Purpose

Produce structured, brand-aligned communication drafts for LinkedIn and professional business contexts. Drafts are reviewed and approved by the human before any publication or distribution.

---

## Trigger Conditions

- Human requests a communication draft (T-01-04)
- W-07 approved content is available and flagged for LinkedIn adaptation

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Human or W-07 provides content source and communication brief | Human / A-01 | Topic brief or approved content | Input confirmed | **Input required** |
| 2 | A-01 assigns drafting task to A-12 | A-01 | Input + communication type | Task assignment | None |
| 3 | LinkedIn post drafts (2 variants) | A-12 | Approved input | LinkedIn drafts | None |
| 4 | Outreach or business communication drafts (if requested) | A-12 | Input + request type | Comm drafts | None |
| 5 | Flag all claims and facts for human verification | A-12 | Draft content | `[VERIFY]` flags | None |
| 6 | Human reviews all drafts and resolves verify flags | Human | All drafts + flags | Approval / revision | **GATE** |
| 7 | Human publishes or sends approved content | Human | Approved draft | — | Human action only |

---

## Required Inputs

- Communication type: LinkedIn post / outreach message / business communication
- Content source: approved content draft, project summary, or human-provided topic brief
- Target audience (if specified)
- Tone instructions (if specified)
- Brand voice guidelines (from `/data/reference/brand/` if available)

---

## Outputs

- LinkedIn drafts: `/data/drafts/communications/[YYYY-MM-DD]-linkedin-drafts.md`
- Outreach drafts: `/data/drafts/communications/[YYYY-MM-DD]-outreach-drafts.md`
- Business communications: `/data/drafts/communications/[YYYY-MM-DD]-business-comms.md`
- Handoff file: `/automation/handoffs/W-10-[YYYY-MM-DD].md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before |
|------|-----------------|--------------|-----------------|
| Step 6 | All drafts + all `[VERIFY BEFORE PUBLISHING]` flags resolved | Human operator | Any content is used |

---

## Safety Rules

- No content is posted, published, or sent by any agent
- All drafts marked `[DRAFT — NOT PUBLISHED]`
- Human is the only party that publishes or sends approved content

---

## Failure / Escalation

- Topic requires a business commitment or statement: mark `[REQUIRES HUMAN DECISION]`, pause
- Conflicting tone or brand instructions: surface conflict, request human resolution
- Content involves legal or financial claims: flag `[SENSITIVE]`, escalate

---

## Prompt File

[/automation/prompts/workflows/w-10-communication-draft-prompt.md](../prompts/workflows/w-10-communication-draft-prompt.md)
