# Agent Inventory

## All Defined Agents — Master Reference

---

## Summary Table

| ID | Agent Name | Domain | Definition File |
|----|---|---|---|
| A-01 | Master Orchestrator Agent | System-wide coordination | [master-orchestrator.md](../../automation/agents/master-orchestrator.md) |
| A-02 | Repository and System Agent | Repo health and documentation | [repository-system-agent.md](../../automation/agents/repository-system-agent.md) |
| A-03 | Website Extraction Agent | Deep website content extraction | [website-extraction-agent.md](../../automation/agents/website-extraction-agent.md) |
| A-04 | Content Structuring Agent | Normalize and classify content | [content-structuring-agent.md](../../automation/agents/content-structuring-agent.md) |
| A-05 | App Mapping Agent | Map content to app schemas | [app-mapping-agent.md](../../automation/agents/app-mapping-agent.md) |
| A-06 | App Differentiation Agent | Derive differentiated app variants | [app-differentiation-agent.md](../../automation/agents/app-differentiation-agent.md) |
| A-07 | Asset and Image Planning Agent | Audit and plan visual assets | [asset-image-planning-agent.md](../../automation/agents/asset-image-planning-agent.md) |
| A-08 | Content Generation Agent | Produce copy, CTAs, FAQs | [content-generation-agent.md](../../automation/agents/content-generation-agent.md) |
| A-09 | Email Triage and Drafting Agent | Email classification and drafts | [email-triage-agent.md](../../automation/agents/email-triage-agent.md) |
| A-10 | Calendar and Scheduling Agent | Schedule extraction and conflict detection | [calendar-scheduling-agent.md](../../automation/agents/calendar-scheduling-agent.md) |
| A-11 | Daily Briefing and Operations Agent | Daily priority compilation | [daily-briefing-agent.md](../../automation/agents/daily-briefing-agent.md) |
| A-12 | LinkedIn and Communication Agent | Social/business communication drafts | [linkedin-communication-agent.md](../../automation/agents/linkedin-communication-agent.md) |
| A-13 | Business Operations Summary Agent | Managerial reporting | [business-operations-agent.md](../../automation/agents/business-operations-agent.md) |
| A-14 | Desktop and File Hygiene Agent | Local file classification plan | [desktop-file-hygiene-agent.md](../../automation/agents/desktop-file-hygiene-agent.md) |
| A-15 | Integration Planning Agent | Future integration definitions | [integration-planning-agent.md](../../automation/agents/integration-planning-agent.md) |

---

## Agent Interaction Rules

1. Agents do **not** communicate directly with each other
2. All inter-agent handoffs route through the Master Orchestrator Agent
3. Each agent reads inputs from defined `/data/` paths
4. Each agent writes outputs to defined `/data/` paths
5. Agents may not access data paths outside their defined scope
6. Any agent that encounters uncertainty must escalate — not guess

---

## Agent Status

| ID | Status | Notes |
|----|---|---|
| A-01 | Defined | Core governance agent |
| A-02 | Defined | Runs post-initialization |
| A-03 | Defined | Requires website URL input |
| A-04 | Defined | Downstream of A-03 |
| A-05 | Defined | Downstream of A-04 |
| A-06 | Defined | Requires base app reference |
| A-07 | Defined | Downstream of A-06 |
| A-08 | Defined | Requires approved mapped content |
| A-09 | Defined | Requires email batch input |
| A-10 | Defined | Downstream of A-09 or standalone |
| A-11 | Defined | Runs on morning schedule |
| A-12 | Defined | Requires approved context |
| A-13 | Defined | Runs on request or schedule |
| A-14 | Defined | Planning only — no destructive actions |
| A-15 | Defined | Documentation only until integrations approved |

---

## Adding New Agents

When a new agent is needed:

1. Create a definition file in `/automation/agents/[agent-name].md`
2. Add it to this inventory table with a new ID
3. Update the routing table in `/docs/orchestration/routing-logic.md`
4. Add it to `/config/responsibilities/agent-responsibilities.md`
5. Create its prompt file in `/automation/prompts/agents/`
6. Notify the Master Orchestrator Agent of the new scope

---

## Agent Extensions

Per-agent plugins, MCP connectors, and recommended GitHub repositories are
catalogued in [`agent-extensions.md`](agent-extensions.md). That document
also proposes new agents (CEO/Strategy, Sales, Finance, Marketing/SEO,
Design/Brand, Legal, Research) for currently-uncovered domains.
