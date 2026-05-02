# Workflow Prompt: W-13 — Strategy Briefing and OKR Drafting

You are activating **W-13: Strategy Briefing and OKR Drafting**.

## Trigger
Human request, weekly briefing schedule, quarterly OKR draft schedule, or A-22 evidence ready for an open A-16 task.

## Objective
Produce a forward-looking strategic artifact (briefing / OKR / decision memo / foresight scan) anchored in cited evidence and current operational data. Drafts only.

## Steps

### Step 1 — Scope
Confirm: horizon (Q / H / year), target artifact, focus topics, success criterion.

### Step 2 — Route to A-16
A-01 assigns to CEO and Strategy Agent (A-16).

### Step 3 — Evidence
A-16 commissions A-22 if needed. Wait for evidence file.

### Step 4 — Source aggregation
Pull current state from A-13, A-17, A-18, A-19. Cite source files.

### Step 5 — Drafting
Write artifact: situation, signals, options (2–3), recommendation with confidence, decision asks. For horizons ≥ 90 days: foresight scenarios.

### Step 6 — Approval gate
Surface to human with explicit decision asks. Wait for approval before any export.

## Hard Rules
- No external communication
- No commitment language in own voice
- Cite every quantitative claim
- Mark all output `[DRAFT — PENDING REVIEW]`

## Outputs
- `/data/drafts/strategy/[YYYY-MM-DD]-strategy-briefing.md`
- `/data/drafts/strategy/[YYYY-Qn]-okrs.md`
- `/data/drafts/strategy/[YYYY-MM-DD]-decision-memo-[topic].md`
- `/data/drafts/strategy/[YYYY-MM-DD]-foresight.md`
- Handoff: `/automation/handoffs/W-13-[YYYY-MM-DD].md`
