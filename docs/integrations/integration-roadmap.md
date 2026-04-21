# Integration Roadmap

## Future Integration Planning — All Domains

**Version:** 1.0  
**Status:** Planning only — no live integrations active  
**Owner:** Integration Planning Agent (A-15)  
**Last Reviewed:** 2026-04-21

---

## 1. Principle

No integration is activated without formal human approval. This document defines what future integrations would provide, their risk level, what must remain human-reviewed, and what data boundaries must exist.

All integration configurations, once approved, are stored in `/config/integrations/`.

---

## 2. Integration Registry

### INT-01 — GitHub Repository Integration

| Property | Value |
|---|---|
| Purpose | Trigger workflows from repository events; store outputs in repo; manage PR-based approvals |
| Risk Level | Medium |
| What it provides | Event triggers (push, PR, issue), file read/write, workflow dispatch |
| Human-reviewed | All main branch writes, all PR merges, all release triggers |
| Data boundaries | Read access to this repo only; no cross-repo operations without approval |
| Status | Planned — not active |
| Approval required | Yes, before any write operations are enabled |

### INT-02 — GitHub Copilot / Agents

| Property | Value |
|---|---|
| Purpose | AI-assisted code review, prompt execution, agent task assistance within GitHub context |
| Risk Level | Low-Medium |
| What it provides | In-IDE suggestions, PR review comments, agent task execution via Copilot |
| Human-reviewed | All generated code before merge; all agent-suggested changes |
| Data boundaries | No access to private data outside repo context |
| Status | Partially active (Copilot instructions defined in `.github/copilot-instructions.md`) |
| Approval required | For any automated commit or PR creation |

### INT-03 — VS Code Integration

| Property | Value |
|---|---|
| Purpose | Local development environment connection; file access; prompt execution from editor |
| Risk Level | Low |
| What it provides | Direct file editing, prompt runner, local agent execution |
| Human-reviewed | All file changes; all agent outputs before saving |
| Data boundaries | Local working directory only; no auto-commit |
| Status | Planned |
| Approval required | No, but auto-commit must be explicitly disabled |

### INT-04 — External Website Ingestion

| Property | Value |
|---|---|
| Purpose | Fetch and extract content from external URLs for the Website Extraction workflow |
| Risk Level | Low |
| What it provides | HTTP content retrieval, sitemap parsing, structured data extraction |
| Human-reviewed | URL list before ingestion; extraction quality spot-check |
| Data boundaries | Read-only; no login credentials; no authenticated sessions by default |
| Status | Planned — manual URL input currently |
| Approval required | Yes, URL list must be approved before any automated crawl |

### INT-05 — Email Source Integration

| Property | Value |
|---|---|
| Purpose | Ingest email batches for triage, classification, and draft preparation |
| Risk Level | **High** |
| What it provides | Email read access, batch export, metadata extraction |
| Human-reviewed | All classification results; all draft responses; all follow-up detections |
| Data boundaries | Read-only inbox access; no send permissions via integration; no credential storage in repo |
| Status | Planned — manual email export currently |
| Approval required | Yes, and must be re-approved after any scope change |
| Notes | Credentials must never be stored in this repository |

### INT-06 — Calendar Source Integration

| Property | Value |
|---|---|
| Purpose | Read calendar data for scheduling support, conflict detection, and briefing compilation |
| Risk Level | Medium |
| What it provides | Event read, free/busy lookup, attendee data |
| Human-reviewed | All detected conflicts; all suggested calendar actions |
| Data boundaries | Read-only by default; write requires separate approval |
| Status | Planned |
| Approval required | Yes for write operations; read-only requires approval at setup |

### INT-07 — Local File / Desktop Intake

| Property | Value |
|---|---|
| Purpose | Classify and route local files for the Desktop and File Hygiene workflow |
| Risk Level | **High** |
| What it provides | Directory listing, file metadata read, routing suggestion |
| Human-reviewed | All routing decisions; all deletion candidates |
| Data boundaries | Defined target folders only; no access to system folders; no auto-delete |
| Status | Planning only — A-14 produces classification plans, not live operations |
| Approval required | Yes for any file movement; always for deletion |

### INT-08 — Data Exports

| Property | Value |
|---|---|
| Purpose | Export approved outputs to downstream systems (CMS, spreadsheet, external storage) |
| Risk Level | Medium |
| What it provides | Formatted exports (JSON, CSV, Markdown, PDF) of approved data |
| Human-reviewed | All exports before transfer; destination verified |
| Data boundaries | Approved data from `/data/exports/` only |
| Status | Planned |
| Approval required | Yes, per export batch |

### INT-09 — App Pipeline Integration

| Property | Value |
|---|---|
| Purpose | Feed differentiated app content and structured data into app build or configuration pipeline |
| Risk Level | **High** |
| What it provides | Structured schema outputs, screen definitions, CTA mappings, content tables |
| Human-reviewed | All differentiation plans before feeding into app; all schema changes |
| Data boundaries | Approved mapped data only; no direct database write without build pipeline review |
| Status | Planning only |
| Approval required | Yes, every time before any pipeline feed |

### INT-10 — Cloud Orchestrator / Workflow Tool

| Property | Value |
|---|---|
| Purpose | Connect to an external orchestration or automation platform (e.g., n8n, Make, Zapier, or custom) |
| Risk Level | **High** |
| What it provides | Trigger automation from external events; chain workflows across systems |
| Human-reviewed | All trigger configurations; all automation flows before activation |
| Data boundaries | Strictly defined per workflow; no blanket access |
| Status | Planning only |
| Approval required | Yes — full governance review before any cloud orchestrator connection |

---

## 3. Integration Activation Checklist

Before any integration is activated:

- [ ] Integration is documented in this registry
- [ ] Risk level is assessed and accepted
- [ ] Data boundaries are explicitly defined
- [ ] Human review points are documented
- [ ] Credentials are stored securely (never in this repo)
- [ ] Integration configuration is stored in `/config/integrations/`
- [ ] Human operator has signed off in writing
- [ ] Rollback plan is defined

---

## 4. Credential Management Rules

- No credentials, tokens, API keys, or passwords are stored in this repository
- All credentials are managed externally (environment variables, secrets manager)
- Credential rotation schedule must be defined before any live integration
- Any accidental credential commit must trigger immediate rotation and incident review
