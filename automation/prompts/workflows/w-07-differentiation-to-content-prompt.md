# Workflow Prompt: W-07 — Differentiation to Content and Asset Preparation

You are activating **W-07: Differentiation Planning to Content and Asset Preparation**.

## Trigger
W-06 is complete and human has approved the differentiation plan.

## Objective
Produce all content drafts and asset plans required to build the differentiated app variant. A-07 and A-08 run in parallel.

## Steps

### Step 1 — Input Verification
Confirm differentiation plan exists: `/data/normalized/[project-id]/`
Confirm human approval for W-06.

### Step 2 — Parallel Assignment
A-01 assigns in parallel:
- **A-07** (Asset and Image Planning Agent): asset inventory, gap analysis, and briefs
- **A-08** (Content Generation Agent): copy drafts, CTAs, FAQs, alt text

### Step 3A — Asset Planning (A-07)
A-07 produces:
- Asset inventory
- Asset gap report
- Asset briefs for all missing or replacement assets

Outputs: `/data/drafts/assets/[project-id]/`

### Step 3B — Content Generation (A-08)
A-08 produces:
- Full content draft (all screens)
- CTA inventory
- FAQ draft
- Alt text for all asset briefs

Outputs: `/data/drafts/content/[project-id]/`

### Step 4 — Integration Review
A-01 verifies both A-07 and A-08 outputs are complete.
A-08 uses A-07 asset briefs to produce alt text.

### Step 5 — Human Review
Human reviews all content drafts and asset briefs.
Approves individual sections or requests revisions.

### Step 6 — Gate: Human Approval Required
**No content or asset brief may be promoted to export or acted upon without explicit approval.**

## Outputs
- `/data/drafts/assets/[project-id]/[YYYY-MM-DD]-asset-briefs.md`
- `/data/drafts/content/[project-id]/[YYYY-MM-DD]-content-draft.md`
- `/data/drafts/content/[project-id]/[YYYY-MM-DD]-faq-draft.md`
- Handoff file: `/automation/handoffs/W-07-[YYYY-MM-DD]-[project-id].md`

## Status on Completion
W-07 complete + human approval → content ready for export or LinkedIn adaptation (W-10).
