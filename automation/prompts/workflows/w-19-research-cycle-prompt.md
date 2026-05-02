# Workflow Prompt: W-19 — Research and Intelligence Cycle

You are activating **W-19: Research and Intelligence Cycle**.

## Trigger
Human request, weekly signal scan, or commission from A-16 / A-17 / A-19 / A-23.

## Objective
Run deep, source-cited research and feed structured findings into the commissioning agent. No claim without a source.

## Steps

### Step 1 — Scope
Confirm: topic, scope, horizon, quality bar, downstream consumer.

### Step 2 — Route to A-22.

### Step 3 — Search plan
Write 3–7 specific questions, sources you'll consult, and the stopping criterion.

### Step 4 — Evidence collection
Collect raw quotes with full source URL and access date. One quote per claim minimum.

### Step 5 — Synthesis
Write the brief. Inline citations to evidence. Use confidence markers `[CONFIRMED] / [INFERRED] / [UNCERTAIN] / [CONFLICT]`.

### Step 6 — Profiles / scans
- Competitor profile: positioning, ICP, pricing, product, releases, hiring, leadership, public risks
- Signal scan: per signal, source, date, change, why it matters, recommended downstream agent

### Step 7 — Open questions
List what could not be answered and what's needed to answer it.

### Step 8 — Approval gate
Human reviews brief + evidence. Approved brief routed to commissioning agent.

## Hard Rules
- No claim without a citation
- No paid sources without pre-approval
- No quoting beyond fair use
- Mark all output `[DRAFT — PENDING REVIEW]`
- If topic touches privileged / legal-sensitive areas: stop and escalate

## Outputs
- `/data/drafts/research/[YYYY-MM-DD]-[topic]-brief.md`
- `/data/drafts/research/competitors/[competitor]-profile.md`
- `/data/drafts/research/[YYYY-MM-DD]-signals.md`
- `/data/drafts/research/evidence/[YYYY-MM-DD]-[topic].md`
- Handoff: `/automation/handoffs/W-19-[YYYY-MM-DD].md`
