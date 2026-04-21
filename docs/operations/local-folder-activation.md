# Local Folder Activation Guide

**Document type:** Operations  
**Scope:** Activating approved folder aliases for local folder analysis (W-11)  
**Last updated:** 2026-04-21  
**Status:** Ready for operator action

---

## Overview

The local-folder-analysis workflow scans approved folders on the operator's
Windows machine without reading file contents. It produces a DRAFT file listing
that feeds into W-11 (Desktop and File Intake Review) via A-14 (Desktop and
File Hygiene Agent).

Real folder paths are **never stored in this repository**. They live as
environment variables on the runner machine. The repository only stores:

- The alias name (e.g. `himmelreich`)
- The environment variable name (e.g. `HIMMELREICH_PATH`)
- Whether the alias is enabled (`true` / `false`)

This separation means no personal or machine-specific data is committed to git.

---

## Alias Reference

### Primary operational aliases

| Alias | Environment variable | Status | Purpose |
|-------|----------------------|--------|---------|
| `himmelreich` | `HIMMELREICH_PATH` | `enabled: false` — needs activation | Himmelreich project folder |
| `downloads` | `DOWNLOADS_PATH` | `enabled: false` — needs activation | Downloads folder |

### Future optional aliases (placeholders only)

| Alias | Environment variable | Status |
|-------|----------------------|--------|
| `wavebyte_app` | `WAVEBYTE_APP_PATH` | `enabled: false` — future use |
| `wavebyte_website` | `WAVEBYTE_WEBSITE_PATH` | `enabled: false` — future use |

### General-purpose aliases

| Alias | Environment variable | Status |
|-------|----------------------|--------|
| `desktop` | `RUNNER_FOLDER_DESKTOP` | `enabled: false` |
| `documents` | `RUNNER_FOLDER_DOCUMENTS` | `enabled: false` |
| `projects` | `RUNNER_FOLDER_PROJECTS` | `enabled: false` |
| `archive` | `RUNNER_FOLDER_ARCHIVE` | `enabled: false` |

---

## Why Real Paths Are Not Stored in Git

Storing real folder paths in a repository would:

- Expose personal directory structures and usernames in git history permanently
- Reveal machine configuration details that could assist targeted attacks
- Bind the configuration to one specific machine, breaking portability
- Violate the repo's governance rule against committing personal identifiable information

Environment variables on the runner machine provide the same functionality
without any of these risks. The operator sets the variable once; the scan
script reads it at runtime.

---

## How to Activate `himmelreich`

Complete these steps in order:

### Step 1 — Set the environment variable on the Windows runner machine

Open an **elevated** PowerShell prompt and run:

```powershell
[System.Environment]::SetEnvironmentVariable(
  "HIMMELREICH_PATH",
  "C:\<actual-path-to-himmelreich-folder>",
  [System.EnvironmentVariableTarget]::Machine
)
```

Replace `C:\<actual-path-to-himmelreich-folder>` with the real path.  
Do not write the real path in any file — type it directly into the terminal.

### Step 2 — Enable the alias in `config/runner.yaml`

In the repository, open `config/runner.yaml`. Find the `himmelreich` block:

```yaml
  himmelreich:
    alias: "himmelreich"
    env_var: "HIMMELREICH_PATH"
    description: "Himmelreich project folder"
    enabled: false
```

Change `enabled: false` to `enabled: true`. Commit and push this change.

### Step 3 — Restart the runner service

The runner service must be restarted to pick up the new environment variable:

```powershell
# Run from C:\actions-runner in an elevated prompt
.\svc.cmd stop
.\svc.cmd start
```

Or via the Windows Services console (`services.msc`): find the
`GitHub Actions Runner` service, right-click → Restart.

### Step 4 — Run the workflow

Go to the repository → Actions → **Local Folder Analysis (W-11)** →
**Run workflow**.

- `folder_alias`: `himmelreich`
- `scan_depth`: `2` (recommended for first run)
- `run_notes`: brief description of why you are running the scan

---

## How to Activate `downloads`

Follow the same four-step process, substituting:

- Environment variable: `DOWNLOADS_PATH`
- Alias: `downloads`
- Real path: the actual Downloads folder path on the runner machine

```powershell
[System.Environment]::SetEnvironmentVariable(
  "DOWNLOADS_PATH",
  "C:\Users\<username>\Downloads",
  [System.EnvironmentVariableTarget]::Machine
)
```

---

## Preparing Future Aliases (`wavebyte_app`, `wavebyte_website`)

The alias entries already exist in `config/runner.yaml` with `enabled: false`.
No further repository changes are needed until the operator is ready to use them.

When ready:

1. Set `WAVEBYTE_APP_PATH` or `WAVEBYTE_WEBSITE_PATH` on the runner machine.
2. Update the description field in `config/runner.yaml` to reflect the actual folder purpose.
3. Set `enabled: true` for the alias.
4. Restart the runner service.
5. Run the workflow with the alias name.

---

## How to Restart the Runner After Changing Environment Variables

Environment variables set with `Machine` scope are only read at process start.
The runner service must be restarted every time you add or change a
`*_PATH` environment variable.

```powershell
# Elevated PowerShell, from the runner installation directory (e.g. C:\actions-runner)
.\svc.cmd stop
.\svc.cmd start

# Verify the service is running
.\svc.cmd status
```

Confirm the runner shows **Idle** at:  
`https://github.com/voigtcarsten4-rgb/Orchestrator_main/settings/actions/runners`

---

## Which Workflow to Run First

Run the **Local Folder Analysis (W-11)** workflow.

- Repository → Actions → **Local Folder Analysis (W-11)** → Run workflow
- Use `himmelreich` as the first alias (or `downloads` if preferred)
- Start with `scan_depth: 2` to keep the first scan manageable

After the scan completes, the DRAFT output is available:

1. As a downloadable artifact on the workflow run page (retained 7 days)
2. Written to `data/inbox/` in the runner's workspace

Proceed to W-11 Step 2 in `automation/workflows/w-11-desktop-file-review.md`.

---

## References

| Resource | Path |
|----------|------|
| Approved folders config | `config/runner.yaml` |
| Workflow file | `.github/workflows/local-folder-analysis.yml` |
| Scan script | `automation/scripts/Scan-LocalFolder.ps1` |
| Runner setup guide | `docs/operations/windows-runner-setup.md` |
| Operator checklist | `docs/operations/local-folder-activation-checklist.md` |
| W-11 workflow definition | `automation/workflows/w-11-desktop-file-review.md` |
| Approvals config | `config/approvals.yaml` (W-11 gate: BLOCKED) |
