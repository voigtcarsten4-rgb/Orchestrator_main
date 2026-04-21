# Website Integration

**Document:** `/docs/integrations/website.md`
**Version:** 1.0
**Date:** 2026-04-21
**Owner:** Integration Planning Agent (A-15)
**Status:** Planned — not active

---

## 1. Overview

This document defines the planned integration between the Orchestrator_main system and the external websites operated for Wave Bite and Himmelreich.

The integration covers two directions: ingesting website content for analysis and structure, and feeding approved content updates back to the website CMS or static build.

---

## 2. Purpose

| Purpose | Description |
|---------|-------------|
| Content ingestion | Extract and structure current website content for analysis, mapping, and regeneration |
| Content update delivery | Push approved content updates back to the website |
| Consistency monitoring | Detect drift between system-managed content and live website content |
| SEO and structure auditing | Support content structuring agent in identifying gaps and improvements |

---

## 3. Websites in Scope

| Project | Website | Status |
|---------|---------|--------|
| Wave Bite | App landing page and ordering site | Planned |
| Himmelreich | Venue website (events, booking, gallery, contact) | Planned |

---

## 4. Data Flows

### Inbound (Website → Orchestrator_main)

| Data Type | Method | Destination in System | Agent |
|-----------|--------|----------------------|-------|
| Full page content | URL-based extraction | `/data/raw/[project-id]/` | A-03 |
| Site structure map | Sitemap parsing | `/data/raw/[project-id]/sitemap.md` | A-03 |
| Existing copy | Extraction and normalization | `/data/extracted/[project-id]/` | A-04 |
| Image and media inventory | Page scan | `/data/reference/[project-id]/media-inventory.md` | A-07 |

### Outbound (Orchestrator_main → Website)

| Data Type | Source in System | Destination | Approval Required |
|-----------|-----------------|-------------|------------------|
| Updated page copy | `/data/exports/[project-id]/website-copy.md` | CMS or static file | Yes — per page |
| New section content | `/data/exports/[project-id]/new-sections.md` | CMS or static file | Yes |
| SEO metadata | `/data/exports/[project-id]/seo-metadata.md` | CMS meta fields | Yes |
| Updated media list | `/data/exports/[project-id]/media-plan.md` | Media library plan | Yes |

---

## 5. Automation Triggers

| Trigger | Description | Status |
|---------|-------------|--------|
| URL list approved | When operator approves URL list, A-03 begins extraction | Planned |
| Content update approved | When operator approves export, system prepares CMS-ready package | Planned |
| Scheduled re-ingestion | Periodic re-extraction to detect content drift | Planned — manual only until trigger activated |

---

## 6. Activation Requirements

Before this integration is activated:

- [ ] CMS type and API access method identified for each website
- [ ] CMS credentials stored securely (never in this repository)
- [ ] Read-only access tested and confirmed for extraction
- [ ] Write-access scoped and limited to specific content fields only
- [ ] Test environment available for staging content before live publication
- [ ] Rollback plan defined (how to revert a published change)
- [ ] Integration configuration stored in `/config/integrations/website.yaml`
- [ ] A-15 has produced a full integration specification for each website

---

## 7. Extraction Rules

| Rule | Description |
|------|-------------|
| URL approval required | No URL is crawled without explicit operator approval |
| Read-only by default | Extraction never modifies the live website |
| Maximum pages per run | 200 pages (configurable in `/config/system.yaml`) |
| No authenticated sessions | Only public-facing content is extracted unless explicitly approved |
| Raw data is immutable | Extracted content stored in `/data/raw/` is never overwritten |

---

## 8. Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Unintended content overwrite on live site | High | All writes require per-page human approval |
| Credentials exposed | Critical | Stored only in external secrets manager |
| Extraction of private or sensitive content | Medium | Only public URLs approved by operator |
| CMS version mismatch causing formatting errors | Medium | Test environment validation before live push |

---

## 9. Related Documents

| Document | Path |
|----------|------|
| Integration roadmap | `/docs/integrations/integration-roadmap.md` |
| Website Extraction Agent | `/automation/agents/website-extraction-agent.md` |
| Content Structuring Agent | `/automation/agents/content-structuring-agent.md` |
| Content Generation Agent | `/automation/agents/content-generation-agent.md` |
| W-03 Website Ingestion | `/automation/workflows/w-03-website-ingestion.md` |
