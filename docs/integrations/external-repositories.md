# External Repositories — Curated Reference List

## Useful GitHub Repositories for the Orchestrator System

**Version:** 1.0
**Status:** Reference only — listing does not imply integration or activation
**Owner:** Integration Planning Agent (A-15)
**Last Reviewed:** 2026-05-02

---

## 1. Purpose

This document is a curated inventory of external GitHub repositories that are
relevant to the operating model of `Orchestrator_main`. Each entry explains
*why* the repository matters for this system, *which domain* it supports, and
*what* the next step would be if we ever decided to use it.

Listing a repository here does **not** activate it. Activation requires a
separate entry in `docs/integrations/integration-roadmap.md` and approval per
`docs/governance/approval-model.md`.

---

## 2. Categories at a Glance

| Category | Why it matters |
|---|---|
| Editor & Local Development | Where prompts and agents are authored and reviewed |
| Memory & Context Persistence | Long-term memory for agents; "responsive memory" |
| Multi-Agent Orchestration | Frameworks that mirror the orchestrator-model |
| Claude & Anthropic Tooling | The primary model family used by this system |
| Model Context Protocol (MCP) | Standard wire format for agent ↔ tool integrations |
| Workflow & Automation Platforms | Candidates for INT-10 cloud orchestration |
| Prompt Engineering & Evaluation | Aligns with `automation/prompts/` governance |
| Knowledge / RAG / Vector Stores | Powers website extraction & content workflows |

---

## 3. Repository Registry

### 3.1 Editor & Local Development

#### R-01 — Cursor

| Property | Value |
|---|---|
| Repository | `getcursor/cursor` |
| URL | https://github.com/getcursor/cursor |
| Domain | Editor / local development environment |
| Why it matters | Primary AI-native editor for authoring prompts, agent specs, and workflow docs in this repo. Pairs naturally with INT-03 (VS Code Integration). |
| Relevant integration | INT-03 — VS Code Integration |
| Risk Level | Low |
| Status | Reference — no auto-commit, no agent execution outside human review |
| Next step if adopted | Document Cursor-specific rules in `.cursor/rules/` mirroring `.github/copilot-instructions.md` |

#### R-02 — VS Code

| Property | Value |
|---|---|
| Repository | `microsoft/vscode` |
| URL | https://github.com/microsoft/vscode |
| Domain | Editor / local development environment |
| Why it matters | Baseline editor that Cursor forks; reference for extension APIs. |
| Relevant integration | INT-03 |
| Risk Level | Low |
| Status | Reference |

---

### 3.2 Memory & Context Persistence ("Responsive Memory")

#### R-03 — Mem0

| Property | Value |
|---|---|
| Repository | `mem0ai/mem0` |
| URL | https://github.com/mem0ai/mem0 |
| Domain | Agent memory layer |
| Why it matters | Persistent, queryable memory for agents — supports the "responsive memory" requirement so agents recall context across sessions. |
| Relevant integration | New: INT-11 (Agent Memory Layer) — to be added when activated |
| Risk Level | Medium (stores conversational data) |
| Status | Reference |
| Next step if adopted | Define data boundaries and retention policy before any write |

#### R-04 — Letta (formerly MemGPT)

| Property | Value |
|---|---|
| Repository | `letta-ai/letta` |
| URL | https://github.com/letta-ai/letta |
| Domain | Stateful agents with hierarchical memory |
| Why it matters | Reference architecture for long-running agents with memory tiers; relevant to multi-day orchestrator operations. |
| Risk Level | Medium |
| Status | Reference |

#### R-05 — Cognee

| Property | Value |
|---|---|
| Repository | `topoteretes/cognee` |
| URL | https://github.com/topoteretes/cognee |
| Domain | Memory & knowledge graph for AI agents |
| Why it matters | Combines vector + graph memory; useful for the Website Extraction and Content Generation domains. |
| Risk Level | Medium |
| Status | Reference |

#### R-06 — Zep

| Property | Value |
|---|---|
| Repository | `getzep/zep` |
| URL | https://github.com/getzep/zep |
| Domain | Long-term memory store for LLM apps |
| Why it matters | Production-oriented memory service with summarization; alternative to Mem0. |
| Risk Level | Medium |
| Status | Reference |

---

### 3.3 Multi-Agent Orchestration

#### R-07 — Microsoft AutoGen

| Property | Value |
|---|---|
| Repository | `microsoft/autogen` |
| URL | https://github.com/microsoft/autogen |
| Domain | Multi-agent conversation framework |
| Why it matters | Reference patterns for the orchestrator-model: agent roles, hand-off, and conversation routing. |
| Risk Level | Low (reference only) |
| Status | Reference |

#### R-08 — CrewAI

| Property | Value |
|---|---|
| Repository | `crewAIInc/crewAI` |
| URL | https://github.com/crewAIInc/crewAI |
| Domain | Role-based multi-agent orchestration |
| Why it matters | Maps directly to the agent-inventory model (specialized agents with bounded responsibilities). |
| Risk Level | Low |
| Status | Reference |

#### R-09 — LangGraph

| Property | Value |
|---|---|
| Repository | `langchain-ai/langgraph` |
| URL | https://github.com/langchain-ai/langgraph |
| Domain | Stateful, graph-based agent workflows |
| Why it matters | Closest analogue to the orchestrator's workflow + routing model. Useful reference for `config/routing.yaml`. |
| Risk Level | Low |
| Status | Reference |

#### R-10 — LangChain

| Property | Value |
|---|---|
| Repository | `langchain-ai/langchain` |
| URL | https://github.com/langchain-ai/langchain |
| Domain | LLM application framework |
| Why it matters | Common building blocks (loaders, retrievers, tools) that map to several orchestrator domains. |
| Risk Level | Low |
| Status | Reference |

---

### 3.4 Claude & Anthropic Tooling

#### R-11 — Claude Code

| Property | Value |
|---|---|
| Repository | `anthropics/claude-code` |
| URL | https://github.com/anthropics/claude-code |
| Domain | CLI agent / coding assistant (used by this repo) |
| Why it matters | Drives the agent runtime currently operating on this repository; settings, hooks, and slash commands govern session behavior. |
| Risk Level | Low |
| Status | Active (reference for hooks, settings, skills) |

#### R-12 — Anthropic Cookbook

| Property | Value |
|---|---|
| Repository | `anthropics/anthropic-cookbook` |
| URL | https://github.com/anthropics/anthropic-cookbook |
| Domain | Reference recipes for Claude API |
| Why it matters | Patterns for prompt caching, tool use, and structured output that apply directly to `automation/prompts/`. |
| Risk Level | Low |
| Status | Reference |

#### R-13 — Anthropic Courses

| Property | Value |
|---|---|
| Repository | `anthropics/courses` |
| URL | https://github.com/anthropics/courses |
| Domain | Educational material on prompting and tool use |
| Why it matters | Prompt engineering reference aligned with the prompt-first principle of this orchestrator. |
| Risk Level | Low |
| Status | Reference |

#### R-14 — Anthropic Quickstarts

| Property | Value |
|---|---|
| Repository | `anthropics/anthropic-quickstarts` |
| URL | https://github.com/anthropics/anthropic-quickstarts |
| Domain | Starter projects (agents, RAG, computer use) |
| Why it matters | Templates that accelerate prototyping for new orchestrator workflows. |
| Risk Level | Low |
| Status | Reference |

---

### 3.5 Model Context Protocol (MCP)

#### R-15 — MCP Specification

| Property | Value |
|---|---|
| Repository | `modelcontextprotocol/specification` |
| URL | https://github.com/modelcontextprotocol/specification |
| Domain | Protocol spec for tool/agent integrations |
| Why it matters | Defines the wire format used by the MCP servers already attached to this session. |
| Risk Level | Low |
| Status | Reference |

#### R-16 — MCP Servers

| Property | Value |
|---|---|
| Repository | `modelcontextprotocol/servers` |
| URL | https://github.com/modelcontextprotocol/servers |
| Domain | Reference MCP server implementations |
| Why it matters | Catalog of vetted servers (filesystem, git, fetch, etc.) that could back several integrations in the roadmap. |
| Risk Level | Low–Medium per server |
| Status | Reference |

---

### 3.6 Workflow & Automation Platforms (INT-10 candidates)

#### R-17 — n8n

| Property | Value |
|---|---|
| Repository | `n8n-io/n8n` |
| URL | https://github.com/n8n-io/n8n |
| Domain | Self-hostable workflow automation |
| Why it matters | Strongest fit for INT-10 because it is self-hostable and auditable; matches the human-in-the-loop principle. |
| Relevant integration | INT-10 — Cloud Orchestrator / Workflow Tool |
| Risk Level | High (cross-system automation) |
| Status | Candidate — not active |

#### R-18 — Activepieces

| Property | Value |
|---|---|
| Repository | `activepieces/activepieces` |
| URL | https://github.com/activepieces/activepieces |
| Domain | Open-source workflow automation |
| Why it matters | Alternative INT-10 candidate with a friendlier UI; useful as a fallback. |
| Relevant integration | INT-10 |
| Risk Level | High |
| Status | Candidate |

#### R-19 — Windmill

| Property | Value |
|---|---|
| Repository | `windmill-labs/windmill` |
| URL | https://github.com/windmill-labs/windmill |
| Domain | Developer-first workflow engine and internal tools |
| Why it matters | Code-centric automation that aligns with documentation-first governance. |
| Relevant integration | INT-10 |
| Risk Level | High |
| Status | Candidate |

---

### 3.7 Prompt Engineering & Evaluation

#### R-20 — promptfoo

| Property | Value |
|---|---|
| Repository | `promptfoo/promptfoo` |
| URL | https://github.com/promptfoo/promptfoo |
| Domain | Prompt testing and evaluation |
| Why it matters | Provides regression testing for `automation/prompts/`, supporting traceability and quality. |
| Risk Level | Low |
| Status | Reference |

#### R-21 — DSPy

| Property | Value |
|---|---|
| Repository | `stanfordnlp/dspy` |
| URL | https://github.com/stanfordnlp/dspy |
| Domain | Programmatic prompt optimization |
| Why it matters | Reference for systematic prompt improvement aligned with the documentation-first principle. |
| Risk Level | Low |
| Status | Reference |

---

### 3.8 Knowledge / RAG / Vector Stores

#### R-22 — Chroma

| Property | Value |
|---|---|
| Repository | `chroma-core/chroma` |
| URL | https://github.com/chroma-core/chroma |
| Domain | Embeddings database |
| Why it matters | Lightweight vector store for the Website Extraction and Content Generation workflows. |
| Risk Level | Low |
| Status | Reference |

#### R-23 — Qdrant

| Property | Value |
|---|---|
| Repository | `qdrant/qdrant` |
| URL | https://github.com/qdrant/qdrant |
| Domain | Vector search engine |
| Why it matters | Production-grade alternative for larger corpora. |
| Risk Level | Low–Medium |
| Status | Reference |

#### R-24 — LlamaIndex

| Property | Value |
|---|---|
| Repository | `run-llama/llama_index` |
| URL | https://github.com/run-llama/llama_index |
| Domain | Data framework for LLM applications |
| Why it matters | Structured ingestion and retrieval, aligning with the data-flow model. |
| Risk Level | Low |
| Status | Reference |

---

## 4. Adding a New Repository

To add a repository to this list:

1. Confirm it maps to at least one orchestrator domain (see `README.md`).
2. Use the registry block format above (Repository, URL, Domain, Why it matters, Risk Level, Status).
3. If activation is intended, also create a matching entry in
   `docs/integrations/integration-roadmap.md` and follow the activation
   checklist there.
4. Update the "Last Reviewed" date at the top of this document.

---

## 5. Removal Policy

A repository is removed from this list when:

- The project is archived or unmaintained for more than 12 months, or
- It no longer maps to any active or planned orchestrator domain, or
- A clearly superior alternative replaces it (note the replacement in commit message).

---

*Maintained by the Integration Planning Agent (A-15) under governance of the Master Orchestrator Agent.*
