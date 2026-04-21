# Workflow Prompt: W-10 — Communication Draft Preparation

You are activating **W-10: Communication Draft Preparation**.

## Trigger
Human requests a LinkedIn post, business communication, or outreach draft, or approved content from W-07 is ready for communication adaptation.

## Objective
Produce structured, brand-aligned communication drafts for LinkedIn and professional business use. All drafts require human approval before any use.

## Steps

### Step 1 — Input Collection
A-01 confirms:
- Communication type requested: LinkedIn post / outreach message / business communication
- Source material: approved content draft, project summary, or human-provided topic brief
- Target audience (if specified)
- Tone instructions (if specified)

### Step 2 — Route to A-12
A-01 assigns to LinkedIn and Communication Agent (A-12).

### Step 3 — Draft Production
A-12 produces:
- LinkedIn post drafts (2 variants: professional + conversational)
- Outreach message drafts (if requested)
- Business communication draft (if requested)
- Hashtag suggestions for LinkedIn posts

All marked: `[DRAFT — NOT PUBLISHED]`

### Step 4 — Fact and Claim Review
A-12 flags any claims, statistics, or references marked `[VERIFY BEFORE PUBLISHING]`.
Human must verify all flagged items before approving.

### Step 5 — Human Review and Approval
Human reviews all drafts.
Selects preferred variant(s).
Verifies any flagged claims.
**Human publishes or sends approved content — system does not.**

## Outputs
- `/data/drafts/communications/[YYYY-MM-DD]-linkedin-drafts.md`
- `/data/drafts/communications/[YYYY-MM-DD]-outreach-drafts.md`
- `/data/drafts/communications/[YYYY-MM-DD]-business-comms.md`
- Handoff file: `/automation/handoffs/W-10-[YYYY-MM-DD].md`
