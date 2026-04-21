# Local Folder Analysis — Readiness Status

**Document type:** Operations  
**Scope:** Self-hosted runner local folder analysis (W-11)  
**Last updated:** 2026-04-21

---

## What Is Already Implemented

The following components are fully implemented and committed to the repository:

| Component | File | Status |
|-----------|------|--------|
| GitHub Actions workflow | `.github/workflows/local-folder-analysis.yml` | Ready |
| Alias configuration | `config/runner.yaml` | Ready — aliases defined, all disabled |
| Scan script | `automation/scripts/Scan-LocalFolder.ps1` | Ready |
| Runner setup guide | `docs/operations/windows-runner-setup.md` | Ready |
| Activation guide | `docs/operations/local-folder-activation.md` | Ready |
| Activation checklist | `docs/operations/local-folder-activation-checklist.md` | Ready |
| W-11 workflow definition | `automation/workflows/w-11-desktop-file-review.md` | Ready |
| A-14 agent definition | `automation/agents/desktop-file-hygiene-agent.md` | Ready |

### What the implementation already supports

- Alias-based folder selection: the workflow accepts a `folder_alias` input and validates it against `config/runner.yaml`
- Environment variable path resolution: `Scan-LocalFolder.ps1` reads the real folder path from a named env var — no paths in git
- Input validation: alias name is pattern-matched; depth is range-checked; alias must be defined and enabled
- Read-only metadata scan: only filename, kind, extension, size, and last-modified are captured — file contents are never read
- DRAFT output: scan result is written as a Markdown file to `data/inbox/` and uploaded as a workflow artifact
- W-11 integration: output format and next-step instructions are aligned with W-11 Steps 1–7
- Governance alignment: approval gate is BLOCKED (per `config/approvals.yaml`); no automated file action is possible

---

## What the Operator Still Must Do Locally

These steps cannot be completed by the repository — they require action on the
Windows runner machine:

| # | Action | Where |
|---|--------|-------|
| 1 | Register the self-hosted Windows runner with the `local-analysis` label | Runner machine + GitHub settings |
| 2 | Install the runner as a Windows service (recommended) | Runner machine |
| 3 | Set `HIMMELREICH_PATH` as a System environment variable | Runner machine |
| 4 | Set `DOWNLOADS_PATH` as a System environment variable | Runner machine |
| 5 | Enable the `himmelreich` alias in `config/runner.yaml` (set `enabled: true`, commit) | Repository |
| 6 | Enable the `downloads` alias in `config/runner.yaml` (set `enabled: true`, commit) | Repository |
| 7 | Restart the runner service after setting env vars | Runner machine |

See `docs/operations/windows-runner-setup.md` for runner registration steps.  
See `docs/operations/local-folder-activation-checklist.md` for the complete activation sequence.

---

## Which Alias to Test First

**Recommended: `himmelreich`**

Reasons:
- It is a bounded, project-specific folder rather than a large system folder
- A shallower and more predictable item count makes it easier to verify the output
- It directly supports the primary use case for W-11

If the Himmelreich folder is not yet accessible on the runner machine,
use `downloads` as an alternative first test. Downloads folders typically
contain a known mix of file types that are straightforward to classify.

**Recommended first scan settings:**
- `folder_alias`: `himmelreich` (or `downloads`)
- `scan_depth`: `2`
- `run_notes`: `first activation test`

---

## What Successful Output Looks Like

A successful first scan produces a Markdown file with this structure:

```
# File Listing Draft — himmelreich

| Field | Value |
|-------|-------|
| Source | Scan-LocalFolder.ps1 |
| Agent | A-14 Desktop and File Hygiene Agent |
| Workflow | W-11 Desktop and File Intake Review |
| Date | 2026-MM-DD HH:MM |
| Status | DRAFT — human review required before any action |
| Approved by | [PENDING — human approval required] |
| Folder alias | himmelreich |
| Scan depth | 2 |
| Total items | <number> |

---

## File Listing

| # | Indent | Name | Kind | Ext | Size (KB) | Last Modified | Relative Path |
...
```

Key indicators the scan succeeded correctly:
- Status field shows `DRAFT — human review required before any action`
- File listing table contains entries matching the expected folder contents
- Footer message: "No files were read, moved, renamed, or deleted during this scan"
- Artifact is downloadable from the workflow run page
- Job summary on the Actions run page displays the run table

---

## Next Recommended Steps After First Successful Scan

1. **Download and review the DRAFT output**  
   Download the artifact from the workflow run. Read every entry. Confirm no
   unexpected or sensitive filenames appear.

2. **Proceed with W-11 Step 2 — A-01 assigns analysis to A-14**  
   Open the scan file from `data/inbox/` and begin the W-11 classification
   workflow defined in `automation/workflows/w-11-desktop-file-review.md`.

3. **A-14 classifies each file**  
   A-14 applies classification tags:
   `[KEEP]`, `[ARCHIVE]`, `[REVIEW]`, `[DUPLICATE-CANDIDATE]`, `[SENSITIVE]`, `[EMPTY-OR-PLACEHOLDER]`

4. **Human review gate (W-11 Step 7 — GATE)**  
   Review the classification and routing plan. Approve or adjust per-item
   recommendations. This gate is **BLOCKED** — no automated file action
   can proceed without individual human approval.

5. **Activate `downloads` alias (if not done in parallel)**  
   Once the first scan is verified, activate the `downloads` alias following
   the same checklist steps.

6. **Consider future alias activation**  
   `wavebyte_app` and `wavebyte_website` aliases are defined as placeholders.
   Activate them when the operator is ready, following the same process.

---

## References

| Resource | Path |
|----------|------|
| Activation checklist | `docs/operations/local-folder-activation-checklist.md` |
| Activation guide | `docs/operations/local-folder-activation.md` |
| Runner setup | `docs/operations/windows-runner-setup.md` |
| Alias config | `config/runner.yaml` |
| Workflow | `.github/workflows/local-folder-analysis.yml` |
| W-11 definition | `automation/workflows/w-11-desktop-file-review.md` |
| Approvals | `config/approvals.yaml` |
