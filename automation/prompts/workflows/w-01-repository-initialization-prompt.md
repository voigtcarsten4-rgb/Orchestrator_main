# Workflow Prompt: W-01 — Repository Initialization

You are activating **W-01: New Repository Initialization**.

## Trigger
This workflow runs when the repository is first created or re-initialized.

## Objective
Ensure the repository structure is complete, all required folders and placeholder files exist, and all documentation is in place before any other workflow runs.

## Steps

### Step 1 — Assign to A-02
Route to Repository and System Agent (A-02).

### Step 2 — Structure Audit
A-02 verifies the following folders exist (create with `.gitkeep` if missing):
- `/data/inbox/`, `/data/raw/`, `/data/extracted/`, `/data/mapped/`, `/data/normalized/`
- `/data/drafts/`, `/data/exports/`, `/data/reports/`, `/data/reference/`
- `/automation/agents/`, `/automation/prompts/agents/`, `/automation/prompts/workflows/`
- `/automation/prompts/templates/`, `/automation/prompts/orchestrator/`
- `/automation/workflows/`, `/automation/handoffs/`
- `/config/`, `/docs/system/`, `/assets/briefings/`, `/assets/generated/`, `/assets/reference/`

### Step 3 — Documentation Check
A-02 verifies the following files exist and are non-empty:
- `/docs/architecture/system-overview.md`
- `/docs/agents/agent-inventory.md`
- `/docs/workflows/workflow-inventory.md`
- `/docs/governance/automation-governance.md`
- `/docs/governance/approval-model.md`
- `/config/routing.yaml`, `/config/triggers.yaml`, `/config/approvals.yaml`, `/config/system.yaml`
- `.github/copilot-instructions.md`

### Step 4 — Agent Definition Check
Verify all 15 agent definition files exist in `/automation/agents/`.

### Step 5 — Report
A-02 produces a repository health report: `/data/reports/[YYYY-MM-DD]-repository-health-report.md`

### Step 6 — Human Review
Human reviews the health report and confirms initialization is complete.

## Outputs
- `/data/reports/[YYYY-MM-DD]-repository-health-report.md`
- Handoff file: `/automation/handoffs/W-01-[YYYY-MM-DD]-init.md`

## Status on Completion
W-01 complete → system ready for all other workflows.
