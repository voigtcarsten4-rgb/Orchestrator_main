# Briefing HTML Guidelines

**Module:** Executive Assistant System — Templates  
**Document type:** HTML output standard  
**Last updated:** 2026-04-22

---

## Purpose

Defines how the CEO briefing should be formatted when delivered as an HTML document (e.g. via email or a browser-based view). The Markdown briefing format (used in `reports/`) is the primary format; this guide governs the HTML version used for delivery.

---

## Design Principles

- **Mobile-readable** — must be readable on a phone without zooming
- **No external dependencies** — no CDN links, no web fonts, no remote images
- **Print-friendly** — should print cleanly to a single A4 page
- **Colour-coded risk levels** — consistent with the risk classification system
- **Dark mode compatible** — avoid pure white backgrounds; use near-white (#f9f9f9)

---

## Colour System

| Purpose | Hex code | Used for |
|---------|----------|---------|
| Critical / Red | `#C0392B` | Critical risk flags, critical finance items |
| Warning / Amber | `#D68910` | Warning items, items due this week |
| Informational / Green | `#1E8449` | On-track items, completed items |
| Unknown / Grey | `#7F8C8D` | Unknown or unverified items |
| Primary text | `#1a1a2e` | Headings and body text |
| Secondary text | `#555555` | Supporting details |
| Muted text | `#888888` | Timestamps, labels, footnotes |
| Section background | `#f9f9f9` | Section dividers and card backgrounds |
| Accent line | `#1a1a2e` | Top border on signature, dividers |

---

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Main heading (briefing date) | Segoe UI, Arial, sans-serif | 20px | 700 |
| Section heading | Segoe UI, Arial, sans-serif | 15px | 600 |
| Table header | Segoe UI, Arial, sans-serif | 12px | 600 |
| Body text | Segoe UI, Arial, sans-serif | 13px | 400 |
| Muted / label | Segoe UI, Arial, sans-serif | 11px | 400 |

---

## Layout Structure

```html
<div class="briefing-wrapper">
  <div class="briefing-header">
    <!-- Date, status, and metadata -->
  </div>

  <div class="section-executive-summary">
    <!-- Section 0: Executive Summary -->
  </div>

  <div class="section" id="schedule">
    <!-- Section A: Schedule -->
  </div>

  <!-- ... additional sections ... -->

  <div class="section-confidence">
    <!-- Section Z: Confidence markers -->
  </div>

  <div class="briefing-footer">
    <!-- Agent, source, status line -->
  </div>
</div>
```

---

## Risk Indicator Markup

Use inline HTML spans for risk indicators:

```html
<!-- Critical -->
<span style="color: #C0392B; font-weight: 600;">🔴 CRITICAL</span>

<!-- Warning -->
<span style="color: #D68910; font-weight: 600;">🟡 WARNING</span>

<!-- Informational -->
<span style="color: #1E8449;">🟢 ON TRACK</span>

<!-- Unknown -->
<span style="color: #7F8C8D;">⚪ UNKNOWN</span>
```

---

## Table Style

All briefing tables:

```html
<table style="
  border-collapse: collapse;
  width: 100%;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 13px;
">
  <thead>
    <tr style="background-color: #f0f0f0;">
      <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #cccccc;">Column</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eeeeee;">Value</td>
    </tr>
  </tbody>
</table>
```

---

## Footer Block

Every HTML briefing must include a traceability footer:

```html
<div style="
  margin-top: 24px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
  font-size: 11px;
  color: #aaaaaa;
">
  Source: [Agent] &middot; Workflow: [W-XX] &middot; Date: [YYYY-MM-DD HH:MM] &middot; Status: DRAFT
</div>
```

---

*References: `FINANCE_SUMMARY_TEMPLATE.md`, `briefing/BRIEFING_EXPANSION_PLAN.md`*
