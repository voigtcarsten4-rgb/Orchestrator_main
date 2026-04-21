# Automation Prompts — README

**Version:** 1.0  
**Managed by:** A-02 Repository and System Agent  
**Last Updated:** 2026-04-21

---

## Directory Structure

```
/automation/prompts/
├── orchestrator/          — Master Orchestrator Agent prompt
├── agents/                — One operational prompt per agent (A-01 to A-15)
├── workflows/             — One prompt per workflow (W-01 to W-12)
└── templates/             — Reusable prompt blocks
```

---

## Prompt Inventory

### Orchestrator

| File | Agent |
|------|-------|
| `orchestrator/master-orchestrator-prompt.md` | A-01 Master Orchestrator Agent |

### Agent Prompts

| File | Agent |
|------|-------|
| `agents/repository-system-agent-prompt.md` | A-02 |
| `agents/website-extraction-agent-prompt.md` | A-03 |
| `agents/content-structuring-agent-prompt.md` | A-04 |
| `agents/app-mapping-agent-prompt.md` | A-05 |
| `agents/app-differentiation-agent-prompt.md` | A-06 |
| `agents/asset-image-planning-agent-prompt.md` | A-07 |
| `agents/content-generation-agent-prompt.md` | A-08 |
| `agents/email-triage-agent-prompt.md` | A-09 |
| `agents/calendar-scheduling-agent-prompt.md` | A-10 |
| `agents/daily-briefing-agent-prompt.md` | A-11 |
| `agents/linkedin-communication-agent-prompt.md` | A-12 |
| `agents/business-operations-agent-prompt.md` | A-13 |
| `agents/desktop-file-hygiene-agent-prompt.md` | A-14 |
| `agents/integration-planning-agent-prompt.md` | A-15 |

### Workflow Prompts

| File | Workflow |
|------|---------|
| `workflows/w-01-repository-initialization-prompt.md` | W-01 |
| `workflows/w-02-project-intake-prompt.md` | W-02 |
| `workflows/w-03-website-ingestion-prompt.md` | W-03 |
| `workflows/w-04-extraction-to-structured-prompt.md` | W-04 |
| `workflows/w-05-structured-to-app-mapping-prompt.md` | W-05 |
| `workflows/w-06-mapping-to-differentiation-prompt.md` | W-06 |
| `workflows/w-07-differentiation-to-content-prompt.md` | W-07 |
| `workflows/w-08-daily-briefing-prompt.md` | W-08 |
| `workflows/w-09-email-to-calendar-prompt.md` | W-09 |
| `workflows/w-10-communication-draft-prompt.md` | W-10 |
| `workflows/w-11-desktop-file-review-prompt.md` | W-11 |
| `workflows/w-12-report-generation-prompt.md` | W-12 |

### Templates

| File | Usage |
|------|-------|
| `templates/email-draft-template.md` | All email reply drafts (A-09) |
| `templates/analysis-report-template.md` | All analysis and classification outputs |
| `templates/report-template.md` | Operations and business reports (A-11, A-13) |
| `templates/cleanup-routing-template.md` | File hygiene and routing plans (A-14) |

---

## Prompt Rules

1. Every agent must have a corresponding prompt file before it can be activated
2. Prompts are version-controlled and reviewed as part of W-01 health checks
3. Ad-hoc prompts are not permitted — all prompts must be registered here
4. Changes to prompts require human review if they affect agent behaviour or output format
