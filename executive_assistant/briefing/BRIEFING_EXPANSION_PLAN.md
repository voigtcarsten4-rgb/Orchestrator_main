# Briefing Expansion Plan

**Module:** Executive Assistant System — Briefing  
**Document type:** Expanded briefing specification  
**Last updated:** 2026-04-22

---

## Purpose

This document defines the expanded CEO briefing format. It replaces the standard A-11 daily briefing with a decision-ready executive view that integrates email, calendar, finance, contacts, risks, opportunities, and Pareto prioritisation — across both business and private domains.

---

## Design Principles

1. **Decision-ready, not information-dump** — every section drives an action or a decision, not just awareness
2. **Prioritised, not chronological** — most important items first, regardless of when they arrived
3. **Pareto-first** — the highest-leverage action is named explicitly every day
4. **Integrated** — business and private are both visible; the operator sees the full picture
5. **Conflict-aware** — schedule, resource, and communication conflicts are surfaced proactively
6. **Maximum 10-minute read** — the briefing must be completable in one focused morning session

---

## Briefing Structure

### Section 0 — Executive Summary

Three bullet points maximum. Each names a priority and the required action in one sentence.

```
• [Priority 1]: [What needs to happen today]
• [Priority 2]: [What needs to happen today]
• [Priority 3]: [What needs to happen today]
```

Purpose: If the operator reads nothing else, they know the three most important things.

---

### Section A — Today's Schedule

| Time | Event | Attendees | Prep required | Conflict |
|------|-------|-----------|---------------|---------|
| 09:00 | [Meeting name] | [Names] | Yes — [what to prepare] | — |
| 11:30 | [Meeting name] | [Names] | No | Back-to-back with 11:00 |

**Conflict flags:**
- Back-to-back meetings with no buffer
- Missing prep context for a meeting with a key client or partner
- Double-booked time slots
- Meetings that should have been cancelled or rescheduled (no agenda, no attendees)

---

### Section B — Open Decisions

Items that require a human decision today — not action, but a decision that unblocks something.

| # | Decision needed | Blocked workflow | By when |
|---|----------------|-----------------|---------|
| 1 | [Decision text] | [What is waiting] | Today / This week |

---

### Section C — Email Highlights

Not a full email triage — this is a curated list of threads requiring attention.

| Priority | Sender | Subject | Required action | Age |
|----------|--------|---------|----------------|-----|
| 🔴 Now | [Name] | [Subject] | Reply / Forward / Decide | X days |
| 🟡 Today | [Name] | [Subject] | Reply / Read / Archive | X days |

Carried-over items from yesterday's briefing are marked `[CARRYOVER]`.

---

### Section D — Contact Pulse

Key contacts with recent activity or a follow-up due.

| Contact | Relationship | Last interaction | Action |
|---------|-------------|-----------------|--------|
| [Name] | Client | 8 days ago | Follow-up — no reply to last message |
| [Name] | Partner | Yesterday | No action needed |
| [Name] | Supplier | 30+ days | Relationship check — unusual silence |

---

### Section E — Risk Register

Active risks requiring attention this week. Categorised by domain.

| Risk | Domain | Severity | Status | Recommended action |
|------|--------|----------|--------|--------------------|
| [Risk description] | Finance / Legal / Ops / Personal | 🔴 / 🟡 / 🟢 | Open / Escalating | [Action] |

Risk types:
- **Financial** — cash flow, overdue positions, credit exposure
- **Legal** — contracts, authority correspondence, disputes
- **Operational** — delivery risk, supplier failure, capacity
- **Relationship** — key client or partner at risk
- **Personal** — private matters with operational impact

---

### Section F — Finance Status

*(Full specification in `finance/FINANCE_BRIEFING_EXTENSION.md`)*

Short version:
- Open positions summary (critical / warning / informational counts)
- Pareto Focus List — top 3 items requiring action
- Items requiring operator input (missing data)

---

### Section G — Quick Wins

Low-effort, high-value tasks that can be completed in under 15 minutes each.

| Task | Why it matters | Effort |
|------|---------------|--------|
| [Task] | [Impact] | 5 min |
| [Task] | [Impact] | 10 min |

Maximum 5 items. If more are available, show highest-impact 5 only.

---

### Section H — Opportunity Radar

Signals of business development, growth, or relationship opportunities.

| Signal | Source | Potential | Recommended action |
|--------|--------|-----------|-------------------|
| [Client name] expanding — mentioned in email | Email | New project | Follow-up call this week |
| [Partner] referenced us in a LinkedIn post | Social signal | Referral opportunity | Thank + repost |
| [Prospect] has gone quiet — 3 weeks | Email history | Re-engagement | Send low-pressure check-in |

---

### Section I — Pareto Focus

The explicit answer to: "What is the single most important thing I should do this morning?"

```
🎯 PARETO FOCUS — TODAY

Action: [One specific action]
Why: [One sentence — the leverage this creates]
Time to complete: [Estimate]
Linked to: [Finance item / email / decision / risk]
```

For the week (Mondays only):
```
📅 PARETO FOCUS — THIS WEEK

1. [Action 1] — [why it matters most]
2. [Action 2] — [why it matters most]
3. [Action 3] — [why it matters most]
```

---

### Section J — Private Layer

Personal items with operational significance. Kept brief. Listed only if action is needed.

| Item | Category | Action | By when |
|------|----------|--------|---------|
| [Item] | Health / Family / Finance / Admin | [Action] | [Date] |

---

### Section K — Call Prep

For each meeting today involving a key relationship, a short call preparation note:

```
📞 Call Prep: [Name / Company]
Meeting: [Time] — [Topic]
Context: [1–2 sentences from email history or CRM]
Watch for: [Any known tension, open issue, or opportunity]
Suggested opening: [One sentence]
```

---

### Section Z — Confidence Summary

```
[CONFIRMED] — Data sourced directly from email, calendar, or file
[INFERRED] — Derived from patterns or context — verify if acting on it
[UNCERTAIN] — Low-confidence signal — do not act without checking
[MISSING] — Required data was not available for this section
```

---

## Briefing Length Targets

| Section | Target length |
|---------|--------------|
| Executive Summary (Section 0) | 3 lines |
| Schedule (A) | 1 row per event |
| Open Decisions (B) | Max 5 items |
| Email Highlights (C) | Max 8 items |
| Contact Pulse (D) | Max 5 items |
| Risk Register (E) | Max 6 items |
| Finance (F) | 1 table + Pareto list |
| Quick Wins (G) | Max 5 items |
| Opportunity Radar (H) | Max 4 items |
| Pareto Focus (I) | 1 box (daily) |
| Private Layer (J) | Max 3 items |
| Call Prep (K) | 1 block per meeting |

---

## Integration Points

| Section | Data source |
|---------|------------|
| A — Schedule | A-10 Calendar Agent output |
| B — Decisions | Open workflow states, approval queue |
| C — Email | A-09 Email Triage output |
| D — Contact Pulse | Contact extraction output |
| E — Risks | A-13 Business Operations output |
| F — Finance | Finance module output |
| G — Quick Wins | Derived from C, E, F |
| H — Opportunity Radar | A-09, A-12, CRM signals |
| I — Pareto Focus | Finance Pareto + Risk Register |
| J — Private Layer | Personal account triage |
| K — Call Prep | A-10 + A-09 combined |

---

*References: `finance/FINANCE_BRIEFING_EXTENSION.md`, `finance/FINANCE_PARETO_MODEL.md`, `docs/TARGET_ARCHITECTURE.md`*
