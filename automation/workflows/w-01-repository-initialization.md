# Workflow W-01: New Repository Initialization

**ID:** W-01  
**Status:** Active  
**Primary Agent:** A-02 Repository and System Agent  
**Trigger:** Repository created or re-initialized; weekly health check

---

## Purpose

Ensure the repository is structurally complete, all required documentation exists, and the system is ready to run all other workflows. This workflow runs first and is the foundation for all other activity.

---

## Trigger Conditions

- Repository is first created
- Human requests a repository health check (T-01-08)
- A new agent or workflow definition is added (T-02-02, T-02-03)
- Weekly schedule trigger fires (T-03-02, when enabled)

---

## Steps

| Step | Description | Agent | Input | Output | Gate |
|------|-------------|-------|-------|--------|------|
| 1 | Structure audit — verify all required folders exist | A-02 | Repository file listing | Folder gap list | None |
| 2 | Documentation check — verify all required docs exist and are non-empty | A-02 | File listing | Doc gap list | None |
| 3 | Agent definition check — verify all 15 agents have definition files | A-02 | `/automation/agents/` | Agent gap list | None |
| 4 | Config check — verify all 4 config files exist | A-02 | `/config/` | Config gap list | None |
| 5 | Produce health report | A-02 | Steps 1–4 output | Health report | None |
| 6 | Human reviews health report | Human | Health report | Approval decision | **GATE** |

---

## Required Inputs

- Current repository file listing
- Expected structure from `/docs/architecture/system-overview.md`
- Agent inventory from `/docs/agents/agent-inventory.md`
- Workflow inventory from `/docs/workflows/workflow-inventory.md`

---

## Outputs

- Repository health report: `/data/reports/[YYYY-MM-DD]-repository-health-report.md`
- Handoff file: `/automation/handoffs/W-01-[YYYY-MM-DD]-init.md`

---

## Approval Gates

| Gate | What is reviewed | Who approves | Required before |
|------|-----------------|--------------|-----------------|
| Step 6 | Health report completeness and any critical issues | Human operator | System declared ready |

---

## Failure / Escalation

- If critical files are missing (governance docs, config files): flag as CRITICAL in health report, escalate to human before any other workflow runs
- If agent definition files are missing: flag as CRITICAL, escalate
- If a folder is missing: A-02 creates it with `.gitkeep` during the audit

---

## Chaining

W-01 completion confirms system is ready. Human may then initiate any other workflow.

---

## Prompt File

[/automation/prompts/workflows/w-01-repository-initialization-prompt.md](../prompts/workflows/w-01-repository-initialization-prompt.md)
