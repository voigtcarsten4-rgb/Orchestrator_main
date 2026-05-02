# Orchestrator_main

## AI-Assisted Business Operating System — Master Orchestration Repository

This repository is the **central operating core** for a multi-agent, AI-assisted business environment. It coordinates specialized agents, governs automation, stores reusable prompts, defines workflows, and documents the rules that keep the system safe, traceable, and scalable.

---

## What This Repository Is

This is **not** a standard application repository. It is an orchestration layer that:

- Defines **what runs**, when it runs, and who is responsible
- Provides **reusable prompts** for all agents and workflow phases
- Documents **structured workflows** for all operational domains
- Enforces **governance rules** to keep automation safe and human-reviewed where required
- Provides a **single source of truth** for the operating model of the entire AI system

---

## Core Domains

| Domain | Description |
|---|---|
| Project & Business Operations | Task tracking, project intake, operational summaries |
| Website Extraction | Deep content ingestion, URL mapping, structured output |
| App Differentiation | Mapping extracted content to differentiated app variants |
| Content Generation | Copy, CTAs, FAQs, descriptions, structured text |
| Image & Asset Planning | Asset audit, briefing creation, classification |
| Email Triage | Classification, draft preparation, follow-up detection |
| Calendar & Scheduling | Event extraction, conflict detection, reminder prep |
| Daily Briefing | Morning operational summary, priority assembly |
| LinkedIn & Communications | Social/business drafts, outreach, status updates |
| Business Operations Summary | Managerial reporting, blockers, pending decisions |
| Desktop & File Hygiene | Local file classification and routing planning |
| Repository Maintenance | Structure integrity, documentation health, prompt inventory |
| Integration Planning | Future connectors: GitHub, email, calendar, apps, cloud |

---

## Repository Structure

```
/docs             — All architecture, agent, workflow, and governance documentation
/automation       — Prompts, agent definitions, workflow specs, templates, checklists
/data             — Inbox, raw, extracted, mapped, normalized, drafts, exports, reports
/assets           — Generated assets, reference material, daily briefings
/config           — Routing logic, responsibilities, triggers, approvals, integrations
/.github          — GitHub-specific configuration and Copilot instructions
```

---

## Key Entry Points

| Purpose | File |
|---|---|
| System overview | [docs/architecture/system-overview.md](docs/architecture/system-overview.md) |
| Orchestration model | [docs/orchestration/orchestrator-model.md](docs/orchestration/orchestrator-model.md) |
| Agent inventory | [docs/agents/agent-inventory.md](docs/agents/agent-inventory.md) |
| Agent extensions (plugins / connectors / MCPs) | [docs/agents/agent-extensions.md](docs/agents/agent-extensions.md) |
| Workflow inventory | [docs/workflows/workflow-inventory.md](docs/workflows/workflow-inventory.md) |
| Governance rules | [docs/governance/automation-governance.md](docs/governance/automation-governance.md) |
| Approval model | [docs/governance/approval-model.md](docs/governance/approval-model.md) |
| Integration roadmap | [docs/integrations/integration-roadmap.md](docs/integrations/integration-roadmap.md) |
| External repositories (curated) | [docs/integrations/external-repositories.md](docs/integrations/external-repositories.md) |
| Operating goal | [docs/project/operating-goal.md](docs/project/operating-goal.md) |
| Copilot instructions | [.github/copilot-instructions.md](.github/copilot-instructions.md) |

---

## Operating Principles

1. **Documentation-first** — every agent, workflow, and rule is documented before it is executed
2. **Human-in-the-loop** — no destructive or irreversible action runs without explicit approval
3. **Separation of concerns** — agents have clearly bounded responsibilities and cannot exceed them
4. **Traceability** — all outputs are stored with source references, not silently discarded
5. **Draft-before-send** — all communication outputs start in draft state
6. **Safe-by-default** — uncertainty triggers escalation, not silent failure

---

## Getting Started

1. Read [docs/project/operating-goal.md](docs/project/operating-goal.md) to understand the mission
2. Review [docs/architecture/system-overview.md](docs/architecture/system-overview.md) for the full system map
3. Review [docs/agents/agent-inventory.md](docs/agents/agent-inventory.md) for all agent definitions
4. Review [docs/governance/automation-governance.md](docs/governance/automation-governance.md) before running any automation
5. Use [automation/prompts/](automation/prompts/) to find ready-to-use prompts for any task

---

*This repository is maintained by the Repository and System Agent under governance of the Master Orchestrator Agent.*
