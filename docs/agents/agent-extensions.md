# Agent Extensions — Plugins, Connectors & MCP Servers

## Mapping of every Agent to relevant Extensions

**Version:** 1.0
**Status:** Reference only — listing does not activate any connector
**Owner:** Integration Planning Agent (A-15)
**Last Reviewed:** 2026-05-02

> **Central node:** All extensions in this document are evaluated against
> `voigtcarsten4-rgb/Orchestrator_main`, its agents, and its governance.
> Activation still requires an entry in `integration-roadmap.md` and approval
> per `approval-model.md`.

---

## 1. Purpose

For every defined agent (A-01…A-15), this document lists:

1. **MCP Servers** — wire-protocol connectors usable from Claude / Claude Code
   sessions today (already discovered in active sessions).
2. **GitHub Repositories** — code-level extensions from
   `external-repositories.md`.
3. **Connector Ideas** — additional services/plugins worth evaluating later.

It also proposes **new agents** to fill currently-uncovered business domains
(CEO, Sales, Finance, Marketing/SEO, Design/Brand, Legal, Research).

---

## 2. Agent → Extension Matrix

### A-01 — Master Orchestrator Agent ("CEO role")

| Layer | Extensions |
|---|---|
| MCP | GitHub MCP (repo state, PRs), Slack MCP (announcements/decisions), ClickUp MCP (task graph), Google Drive MCP (cross-domain docs) |
| Repos | LangGraph (R-09), AutoGen (R-07), CrewAI (R-08), HumanLayer (R-37), LiteLLM (R-27) |
| Connector ideas | Notion / Coda for executive dashboards, Linear for cross-team backlog, statuspage tooling for ops health |
| Why | Sits above every other agent; needs read access everywhere, write only via approval gate |

### A-02 — Repository and System Agent

| Layer | Extensions |
|---|---|
| MCP | GitHub MCP (issues, PRs, secret scanning) |
| Repos | pre-commit (R-55), TruffleHog (R-53), Gitleaks (R-54), act (R-58), Claude Code (R-11) |
| Connector ideas | Dependabot/Renovate, CodeQL, mkdocs for docs builds |
| Why | Repo health, secret hygiene, doc consistency |

### A-03 — Website Extraction Agent

| Layer | Extensions |
|---|---|
| MCP | Exa Search MCP (web fetch + search), Webflow MCP (CMS pages), Ahrefs MCP (site audit, top pages) |
| Repos | Firecrawl (R-39), Jina Reader (R-40), Crawl4AI (R-41), Playwright (R-42), browser-use (R-43), Unstructured (R-44) |
| Connector ideas | sitemap.xml fetchers, Common Crawl, archive.org wayback machine |
| Why | Core extraction capability; matches INT-04 Website Ingestion |

### A-04 — Content Structuring Agent

| Layer | Extensions |
|---|---|
| MCP | Hugging Face MCP (model catalog for classifiers) |
| Repos | Unstructured (R-44), MarkItDown (R-45), LlamaIndex (R-24), Pydantic AI (R-34) |
| Connector ideas | spaCy NER pipelines, langdetect for language tagging |
| Why | Normalization + classification; benefits from typed schemas |

### A-05 — App Mapping Agent

| Layer | Extensions |
|---|---|
| MCP | Webflow MCP (CMS schema), GitHub MCP (read app definition repos) |
| Repos | Pydantic AI (R-34), DSPy (R-21), LangGraph (R-09) |
| Connector ideas | JSON Schema registry, OpenAPI definitions of target apps |
| Why | Maps content to schemas; strict typing reduces drift |

### A-06 — App Differentiation Agent

| Layer | Extensions |
|---|---|
| MCP | Webflow MCP (component inventory), Adobe MCP (visual differentiation) |
| Repos | LangChain (R-10), LlamaIndex (R-24) |
| Connector ideas | A/B test tooling (GrowthBook, Statsig) for differentiation experiments |
| Why | Produces variants; A/B infra is the natural validation step |

### A-07 — Asset and Image Planning Agent

| Layer | Extensions |
|---|---|
| MCP | Cloudinary MCP (asset library, transforms), Adobe MCP (image edits, vectorize), Stack/Sound MCP (audio briefs) |
| Repos | E2B (R-38) for sandboxed image-tool runs |
| Connector ideas | DAM systems (Bynder, Frontify), Unsplash/Pexels, brand kits |
| Why | Heavy media operations live here; Adobe + Cloudinary already wired |

### A-08 — Content Generation Agent

| Layer | Extensions |
|---|---|
| MCP | Webflow MCP (publish drafts), Mailchimp MCP (campaign content), HubSpot MCP (CRM-aware copy) |
| Repos | Anthropic Cookbook (R-12), promptfoo (R-20), DSPy (R-21), LLMLingua (R-25) |
| Connector ideas | Grammarly/LanguageTool for QA, DeepL for translation |
| Why | Highest-volume LLM consumer; token-saving defaults are critical |

### A-09 — Email Triage and Drafting Agent

| Layer | Extensions |
|---|---|
| MCP | Gmail MCP (read threads, drafts, labels), Apollo MCP (sender enrichment) |
| Repos | Unstructured (R-44) for `.eml` parsing, smolagents (R-35) for narrow triage agents |
| Connector ideas | SaneBox-style classification rules, SPF/DKIM validators |
| Why | Triage = parsing + classification + draft; all three covered |

### A-10 — Calendar and Scheduling Agent

| Layer | Extensions |
|---|---|
| MCP | Calendly MCP (event types, invitees, booking), Outlook/Google Calendar MCP (already attached as `0c2393e9…`) |
| Repos | Pydantic AI (R-34) for typed event objects |
| Connector ideas | Cron-style schedulers, timezone normalizers (pytz/zoneinfo wrappers), Zoom/Meet link generators |
| Why | Calendly + native calendar MCP = end-to-end scheduling |

### A-11 — Daily Briefing and Operations Agent

| Layer | Extensions |
|---|---|
| MCP | ClickUp MCP (task aggregation), Slack MCP (delivery), Gmail MCP (priority threads), Calendly MCP (today's meetings) |
| Repos | Langfuse (R-29), Helicone (R-28) for cost-of-briefing telemetry, Grafana (R-57) for dashboards |
| Connector ideas | Weather APIs, news digests, RSS aggregators |
| Why | Pulls from many sources daily; needs reliable aggregation |

### A-12 — LinkedIn and Communication Agent

| Layer | Extensions |
|---|---|
| MCP | Slack MCP (internal comms), HubSpot MCP (audience segments), Apollo MCP (target accounts), Bitly MCP (trackable links) |
| Repos | DSPy (R-21) for tone optimization |
| Connector ideas | LinkedIn API (when access granted), Buffer/Hootsuite for scheduling |
| Why | Drafts external comms; needs CRM context + link tracking |

### A-13 — Business Operations Summary Agent

| Layer | Extensions |
|---|---|
| MCP | Stripe MCP (revenue/disputes), HubSpot MCP (pipeline health), ClickUp MCP (delivery health), Ahrefs MCP (organic traffic), Bitly MCP (link engagement) |
| Repos | Langfuse (R-29) for AI cost reporting, Grafana (R-57) for unified dashboard |
| Connector ideas | QuickBooks/Xero for finance, BigQuery/Postgres for warehoused metrics |
| Why | Reporting agent; benefits from every data source |

### A-14 — Desktop and File Hygiene Agent

| Layer | Extensions |
|---|---|
| MCP | Google Drive MCP (cloud-side mirror), Cloudinary MCP (media migration target) |
| Repos | Unstructured (R-44), MarkItDown (R-45), Goose (R-36) for local CLI execution |
| Connector ideas | rclone for cross-cloud moves, fdupes for dedup |
| Why | Planning today; activation requires very tight approvals |

### A-15 — Integration Planning Agent

| Layer | Extensions |
|---|---|
| MCP | Make MCP (scenarios, hooks), GitHub MCP (read integration roadmap), HubSpot MCP (CRM-ops alignment) |
| Repos | n8n (R-17), Activepieces (R-18), Windmill (R-19), HumanLayer (R-37) |
| Connector ideas | OpenAPI catalogs, vendor security questionnaires |
| Why | Curates integration registry; lives where the connectors live |

---

## 3. Cross-Cutting Extensions (apply to all agents)

| Extension | Why |
|---|---|
| LiteLLM gateway (R-27) | Routes every model call; central place for caching, cost limits, fallbacks |
| Langfuse (R-29) / Helicone (R-28) | Per-agent cost & token telemetry — required by token-optimization defaults |
| HumanLayer (R-37) | Programmatic approval gates aligned with `approval-model.md` |
| OpenTelemetry (R-56) | Standard traces across agent runs |
| GPTCache (R-26) | Semantic cache shared by recurring workflows |

---

## 4. Proposed New Agents (currently missing)

These domains have strong MCP coverage in this session but no dedicated
agent yet. Each proposal includes the suggested extensions so it can be
spun up quickly.

### A-16 — CEO / Strategy Agent (proposed)

- **Scope:** Quarterly themes, OKR drafting, executive narrative; reads from A-13 Business Ops Summary.
- **Distinction from A-01:** A-01 is the *coordinator* of agents; A-16 is the *content owner* of strategy artifacts.
- **MCP:** GitHub, Slack, ClickUp, HubSpot, Stripe (revenue context), Calendly (executive time)
- **Repos:** LangGraph (R-09), Inspect AI (R-47) for strategy-quality evals
- **Status:** Proposal — not defined

### A-17 — Sales / CRM Agent (proposed)

- **Scope:** Lead scoring, pipeline hygiene, follow-up drafting, account research.
- **MCP:** HubSpot (primary), Apollo (enrichment), Gmail (drafts), Calendly (booking links), Bitly (trackable outreach links)
- **Repos:** smolagents (R-35) for narrow scoring agents
- **Status:** Proposal

### A-18 — Finance Agent (proposed)

- **Scope:** Invoice reconciliation, dispute monitoring, subscription lifecycle, refund drafting (draft only).
- **MCP:** Stripe (primary)
- **Repos:** Pydantic AI (R-34) for typed financial records
- **Status:** Proposal — high-risk, draft-only by default

### A-19 — Marketing / SEO Agent (proposed)

- **Scope:** Keyword tracking, content gap detection, brand-radar monitoring, link analytics.
- **MCP:** Ahrefs (primary), Bitly, Webflow, HubSpot
- **Repos:** Firecrawl (R-39) for competitor capture
- **Status:** Proposal

### A-20 — Design and Brand Agent (proposed)

- **Scope:** Brand consistency, asset templating, image briefs to renders.
- **MCP:** Adobe (primary), Cloudinary, Webflow
- **Repos:** E2B (R-38)
- **Status:** Proposal

### A-21 — Legal / Contract Agent (proposed)

- **Scope:** Contract preparation from templates, signature flows, status tracking. **Always draft-only.**
- **MCP:** DocuSeal/Sign MCP (primary), Google Drive (storage)
- **Repos:** Pydantic AI (R-34) for typed clause schemas
- **Status:** Proposal — high-risk, every send requires approval

### A-22 — Research / Intelligence Agent (proposed)

- **Scope:** Deep research, competitor scans, paper/model discovery, evidence collection.
- **MCP:** Exa Search (primary), Hugging Face (models/datasets/papers), Ahrefs (domain authority context)
- **Repos:** Crawl4AI (R-41), LlamaIndex (R-24), Cognee (R-05)
- **Status:** Proposal

---

## 5. Activation Procedure

For every extension listed here:

1. Add a matching entry to `docs/integrations/integration-roadmap.md`.
2. Confirm token-optimization defaults from `automation-governance.md` Section 8 are honored.
3. Document data boundaries (read-only by default; write requires approval).
4. Store credentials outside the repo per Section 4 of the roadmap.
5. Sign off per `docs/governance/approval-model.md`.

For every **new agent** proposed in Section 4:

1. Create the definition file in `automation/agents/[agent-name].md`.
2. Add to `docs/agents/agent-inventory.md` with the next free ID.
3. Update `docs/orchestration/routing-logic.md`.
4. Update `config/responsibilities/` and `config/triggers.yaml` if scheduled.
5. Create the prompt file under `automation/prompts/agents/`.

---

*Maintained by the Integration Planning Agent (A-15) under governance of the Master Orchestrator Agent.*
