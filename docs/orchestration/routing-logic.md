# Routing Logic

## Master Orchestrator — Task Routing Definitions

---

## 1. Routing Principles

All tasks entering the system are routed according to these principles:

1. **Domain first** — identify the primary domain of the task (website, email, app, content, etc.)
2. **Agent assignment** — match the domain to the responsible agent
3. **Workflow check** — determine if the task belongs to a defined workflow
4. **Prerequisite check** — confirm required inputs exist before assigning
5. **Governance check** — apply approval and safety rules before executing
6. **Output routing** — specify exactly where the output should be stored

---

## 2. Domain-to-Agent Routing Table

| Input Domain | Primary Agent | Secondary Agent (if needed) |
|---|---|---|
| Repository maintenance request | A-02 Repository and System Agent | — |
| Website URL / website ingestion request | A-03 Website Extraction Agent | A-04 Content Structuring Agent |
| Raw extracted website content | A-04 Content Structuring Agent | A-05 App Mapping Agent |
| Structured content for app | A-05 App Mapping Agent | A-06 App Differentiation Agent |
| App mapping output | A-06 App Differentiation Agent | A-07 Asset and Image Planning Agent |
| Image/media assets | A-07 Asset and Image Planning Agent | A-08 Content Generation Agent |
| Content generation request | A-08 Content Generation Agent | — |
| Email batch / email file | A-09 Email Triage and Drafting Agent | A-10 Calendar and Scheduling Agent |
| Calendar/schedule data | A-10 Calendar and Scheduling Agent | A-11 Daily Briefing Agent |
| Morning briefing trigger | A-11 Daily Briefing and Operations Agent | — |
| Communication draft request | A-12 LinkedIn and Communication Agent | — |
| Operations summary request | A-13 Business Operations Summary Agent | — |
| Local file / desktop review | A-14 Desktop and File Hygiene Agent | — |
| Integration planning request | A-15 Integration Planning Agent | — |
| New project intake | A-01 Master Orchestrator (initiates W-02) | A-13 Business Operations Summary Agent |
| Strategy / OKR / decision-memo request | A-16 CEO and Strategy Agent | A-22 Research Agent (evidence) |
| Lead, deal, pipeline, follow-up, account briefing | A-17 Sales and CRM Agent | A-22 (account research), A-09 (delivery drafts) |
| Billing, invoice, refund, dispute, finance summary | A-18 Finance Agent | A-13 (operations context), A-21 (refund-policy review) |
| Rankings, content gaps, mentions, link analytics, content brief | A-19 Marketing and SEO Agent | A-08 (briefs feed content), A-22 (competitor research) |
| Brand audit, asset render, brand drift, design brief | A-20 Design and Brand Agent | A-07 (asset planning), A-08 (copy alignment) |
| Contract draft, clause comparison, signature status, inbound contract memo | A-21 Legal and Contract Agent | A-17 (commercial terms), A-09 (delivery drafts) |
| Research, competitor profile, signal scan, evidence collection | A-22 Research and Intelligence Agent | A-16, A-17, A-19, A-23 (downstream consumers) |
| Social-media post, calendar, atomization, engagement, trend digest | A-23 Social Media Agent | A-08 (long-form source), A-19 (briefs), A-20 (assets), A-12 (LinkedIn long-form only) |
| Personal task, travel, household, personal admin, learning | A-24 Personal Life and Household Agent | A-10 (read-only calendar handshake) |

---

## 3. Workflow Routing Table

| Trigger | Workflow | First Agent Called |
|---|---|---|
| Repository just initialized | W-01 New Repository Initialization | A-02 Repository and System Agent |
| New project or client registered | W-02 New Project or Client Intake | A-01 → A-02 → A-13 |
| New website URL provided | W-03 New Website Ingestion | A-03 Website Extraction Agent |
| Website extraction complete | W-04 Website Extraction to Structured Data | A-04 Content Structuring Agent |
| Structured data ready | W-05 Structured Data to App Mapping | A-05 App Mapping Agent |
| App mapping complete | W-06 App Mapping to Differentiation Planning | A-06 App Differentiation Agent |
| Differentiation plan approved | W-07 Differentiation to Content/Asset Prep | A-07 + A-08 |
| Morning schedule trigger | W-08 Daily Operations Briefing | A-11 Daily Briefing Agent |
| Email batch provided | W-09 Email to Calendar and Follow-up | A-09 Email Triage Agent |
| Communication draft requested | W-10 Communication Draft Preparation | A-12 Communication Agent |
| Local file review triggered | W-11 Desktop and File Intake Review | A-14 File Hygiene Agent |
| Report generation requested | W-12 Report Generation and Approval | A-13 Business Operations Summary Agent |

---

## 4. Output Routing Table

| Output Type | Default Storage Path |
|---|---|
| Raw website content | `/data/raw/[project-id]/` |
| Extracted structured data | `/data/extracted/[project-id]/` |
| Mapped app content | `/data/mapped/[project-id]/` |
| Normalized/classified content | `/data/normalized/[project-id]/` |
| Drafts (any type) | `/data/drafts/[project-id]/` |
| Approved exports | `/data/exports/[project-id]/` |
| Reports | `/data/reports/[date]-[type]-report.md` |
| Asset briefings | `/assets/briefings/[project-id]/` |
| Generated assets | `/assets/generated/[project-id]/` |
| Daily briefings | `/assets/briefings/daily/[YYYY-MM-DD]-briefing.md` |
| Handoff records | `/automation/handoffs/[workflow-id]-[step].md` |
| Strategy artifacts | `/data/drafts/strategy/` |
| Sales drafts and briefings | `/data/drafts/sales/` |
| Finance summaries and proposals | `/data/drafts/finance/` |
| Marketing reports and briefs | `/data/drafts/marketing/` |
| Design audits and renders | `/data/drafts/design/` |
| Legal drafts and memos | `/data/drafts/legal/` |
| Research briefs and evidence | `/data/drafts/research/` |
| Social-media calendars and posts | `/data/drafts/social/` |
| Personal-life drafts (privacy boundary) | `/data/drafts/personal/` |

---

## 5. Escalation Routing

When any of the following conditions occur, the orchestrator routes to human review:

| Condition | Action |
|---|---|
| Agent reports uncertain input | Pause workflow, flag in handoff file, notify human |
| Task spans multiple agent domains ambiguously | Route to human for domain assignment |
| Governance rule conflict | Stop, log, escalate |
| Required input missing | Block step, request input from human |
| Output quality check fails | Route back to originating agent with feedback |
| Approval gate reached | Pause, notify human, wait for approval before continuing |
| Protected system targeted | Block, log, escalate with reason |

---

## 6. Protected Systems

The following systems are **never targeted automatically** without explicit approval:

- Live email send (inbox, SMTP, API)
- Calendar write operations
- File deletion or overwrite
- App deployment or build pipeline
- Repository main branch modifications
- Any live integration endpoint
- Any payment, refund, chargeback, or subscription change (A-18 scope)
- Any contract send or signature (A-21 scope)
- Any social-media publish or schedule (A-12 / A-23 scope)
- Any cross-domain leak of personal data into business folders (A-24 privacy boundary)

---

## 7. Routing Configuration Files

Routing rules are further specified in:

- `/config/routing/` — routing rule definitions
- `/config/triggers/` — trigger condition definitions
- `/config/approvals/` — approval gate policies
- `/config/responsibilities/` — agent responsibility assignments
