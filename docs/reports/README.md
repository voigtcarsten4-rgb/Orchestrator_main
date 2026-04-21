# Reports

## Report Output Archive

This folder stores all system-generated operational and analytical reports.

---

## Report Types

| Type | Naming Convention | Frequency |
|---|---|---|
| Daily Operations Summary | `YYYY-MM-DD-daily-operations-summary.md` | Daily |
| Weekly Operations Summary | `YYYY-MM-DD-weekly-summary.md` | Weekly |
| Website Extraction Report | `YYYY-MM-DD-[project-id]-extraction-report.md` | Per extraction |
| App Differentiation Report | `YYYY-MM-DD-[project-id]-differentiation-report.md` | Per differentiation |
| Repository Health Report | `YYYY-MM-DD-repository-health-report.md` | Weekly |
| Integration Status Report | `YYYY-MM-DD-integration-status-report.md` | Monthly |
| Governance Review | `YYYY-MM-DD-governance-review.md` | Monthly |

---

## Report Standards

All reports stored here must:

1. Include a frontmatter header with: source, agent, workflow, date, status
2. Clearly separate confirmed facts from inferred conclusions
3. Use confidence markers: `[CONFIRMED]`, `[INFERRED]`, `[UNCERTAIN]`
4. Reference the input data they were based on
5. Include an approval record if they were human-reviewed

---

## Access and Archiving

- Reports in this folder are final (post-approval) versions
- Draft reports are stored in `/data/drafts/reports/` until approved
- Reports are never deleted — they form the operational audit trail
- After 90 days, reports may be archived to `/data/reference/archive/` but must not be deleted
