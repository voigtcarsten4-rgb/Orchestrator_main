# Windows Self-Hosted Runner — Setup Guide

**Document type:** Operations  
**Scope:** GitHub Actions self-hosted runner for local folder analysis (W-11)  
**Last updated:** 2026-04-21  
**Status:** DRAFT — operator must complete and verify all steps before first use

---

## Purpose

This guide describes how to register a Windows machine as a GitHub Actions
self-hosted runner for the `Orchestrator_main` repository. Once registered and
configured, the runner enables the
[Local Folder Analysis workflow](./../.github/workflows/local-folder-analysis.yml)
to generate read-only file listings from approved local folders.

The runner is used exclusively by Workflow W-11 (Desktop and File Intake Review)
via Agent A-14 (Desktop and File Hygiene Agent). It performs **no write
operations** — it only reads folder metadata and produces DRAFT output.

---

## Security Rules — Read Before Starting

| Rule | Detail |
|------|--------|
| **No tokens in files** | Never write a runner registration token into any file, script, YAML, or `.env` file. Tokens expire and must be treated as one-time secrets. |
| **No real paths in config** | Folder paths are configured as environment variables on the runner machine, not in `config/runner.yaml` or any committed file. |
| **Least privilege** | The Windows user account running the runner should have read-only access to the folders being scanned. |
| **No credentials stored** | The runner process must not have stored credentials, API keys, or passwords. |
| **Draft output only** | All scan results are draft files. No automated action is ever taken on scanned files. |

---

## Prerequisites

- Windows 10/11 or Windows Server 2019/2022
- PowerShell 7 (pwsh) — [download](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows)
- Network access to `github.com` and `api.github.com`
- A dedicated local Windows user account for the runner (recommended — not your primary account)
- Repository admin access to generate a runner registration token

---

## Step 1 — Create a Dedicated Runner Account (Recommended)

Running the GitHub Actions runner under a dedicated Windows account with
restricted permissions reduces risk:

```powershell
# Run in an elevated PowerShell prompt
net user github-runner <CHOOSE_A_LOCAL_PASSWORD> /add /comment:"GitHub Actions runner account"
```

Grant this account **read-only** access to folders it needs to scan.  
Do **not** give it administrator rights unless strictly required.

---

## Step 2 — Download the GitHub Actions Runner

1. In your browser, navigate to:  
   `https://github.com/voigtcarsten4-rgb/Orchestrator_main/settings/actions/runners/new`
2. Select **Windows** as the operating system.
3. Follow the "Download" instructions shown on that page to download the latest
   runner package to a local folder (e.g. `C:\actions-runner`).

Example (PowerShell — use the exact URL and hash shown on the GitHub page):

```powershell
# Create the runner folder
mkdir C:\actions-runner; cd C:\actions-runner

# Download — use the URL and hash provided on the GitHub settings page
# DO NOT hard-code the URL here; always use the current version shown on GitHub
Invoke-WebRequest -Uri <RUNNER_DOWNLOAD_URL_FROM_GITHUB> -OutFile actions-runner-win-x64.zip

# Verify the hash shown on the GitHub settings page before extracting
# (GitHub displays the expected SHA-256 hash on the new runner page)
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory('actions-runner-win-x64.zip', '.')
```

---

## Step 3 — Register the Runner

A registration token is required. Tokens are **single-use and short-lived**
(approximately 1 hour). Obtain a fresh token immediately before running this
command.

**To get a token:**  
GitHub → Repository → Settings → Actions → Runners → "New self-hosted runner"

**Never store or commit the token. Use it directly in the terminal and discard.**

```powershell
# Run from C:\actions-runner
# Replace <RUNNER_REGISTRATION_TOKEN> with the token shown on the GitHub page.
# Replace <MACHINE_NAME> with a meaningful name for this runner.
.\config.cmd `
  --url https://github.com/voigtcarsten4-rgb/Orchestrator_main `
  --token <RUNNER_REGISTRATION_TOKEN> `
  --name <MACHINE_NAME> `
  --labels "self-hosted,Windows,local-analysis" `
  --runnergroup "Default" `
  --work "_work"
```

**Required labels:** `self-hosted`, `Windows`, `local-analysis`  
The workflow file targets exactly these three labels. If you omit `local-analysis`
the workflow will never be picked up by this runner.

---

## Step 4 — Configure Approved Folder Environment Variables

The scan script resolves real folder paths from environment variables on the
runner machine. This keeps paths out of the repository.

Set a **System environment variable** for each folder alias you plan to enable:

| Alias in `config/runner.yaml` | Environment variable | Example value |
|-------------------------------|----------------------|---------------|
| `desktop` | `RUNNER_FOLDER_DESKTOP` | `C:\Users\<username>\Desktop` |
| `documents` | `RUNNER_FOLDER_DOCUMENTS` | `C:\Users\<username>\Documents` |
| `downloads` | `RUNNER_FOLDER_DOWNLOADS` | `C:\Users\<username>\Downloads` |
| `projects` | `RUNNER_FOLDER_PROJECTS` | `C:\Users\<username>\Projects` |
| `archive` | `RUNNER_FOLDER_ARCHIVE` | `D:\Archive` |

**To set a System environment variable (elevated PowerShell):**

```powershell
[System.Environment]::SetEnvironmentVariable(
  "RUNNER_FOLDER_DESKTOP",
  "C:\Users\<username>\Desktop",
  [System.EnvironmentVariableTarget]::Machine
)
```

Or via GUI: Control Panel → System → Advanced system settings →
Environment Variables → System variables → New.

**After setting variables:** restart the runner service so it picks them up.

---

## Step 5 — Enable Folder Aliases in `config/runner.yaml`

By default every folder alias has `enabled: false`. Before a folder can be
scanned, a human operator must:

1. Open `config/runner.yaml` in the repository.
2. Find the alias entry.
3. Change `enabled: false` to `enabled: true`.
4. Commit and push the change.

This is an explicit human gate — no alias is active until deliberately enabled.

---

## Step 6 — Install the Runner as a Windows Service (Optional but Recommended)

Running as a service ensures the runner starts automatically after reboots:

```powershell
# Run from C:\actions-runner in an elevated prompt
.\svc.cmd install
.\svc.cmd start
```

To run as the dedicated account created in Step 1, specify the account during
service installation when prompted, or update the service via the Windows
Services console (`services.msc`).

---

## Step 7 — Verify the Runner is Online

1. Navigate to:  
   `https://github.com/voigtcarsten4-rgb/Orchestrator_main/settings/actions/runners`
2. Confirm the runner shows status **Idle**.

If it shows **Offline**, check:
- Service is running (`.\svc.cmd status` or Services console)
- Network can reach `github.com`
- Registration token was not expired at time of registration

---

## Step 8 — Test Run

Trigger a test scan via GitHub Actions:

1. Go to the repository → Actions → **Local Folder Analysis (W-11)**
2. Click **Run workflow**
3. Enter a `folder_alias` that has `enabled: true` in `config/runner.yaml`
4. Set `scan_depth` to `1` (shallow test scan)
5. Click **Run workflow**

Expected result:
- Job completes successfully on the self-hosted runner
- A `scan-<alias>-<date>-<run_id>.md` artifact is available for download
- The file is also written to `data/inbox/` in the runner's workspace

---

## Folder Approval Checklist

Before a folder alias is enabled in `config/runner.yaml`, the operator should
confirm:

- [ ] The folder does not contain regulated, sensitive, or confidential material
      that should not be listed in a GitHub Actions artifact
- [ ] The runner service account has read-only access to the folder
- [ ] The correct environment variable is set on the runner machine
- [ ] The alias entry in `config/runner.yaml` has been reviewed and committed

---

## Unregistering the Runner

To remove the runner permanently:

```powershell
# Stop and uninstall the service first (if installed as service)
.\svc.cmd stop
.\svc.cmd uninstall

# Remove the runner registration
# A removal token is required — obtain it from the GitHub settings page
# (Settings → Actions → Runners → select runner → Remove → "Manually remove")
.\config.cmd remove --token <RUNNER_REMOVAL_TOKEN>
```

---

## References

| Resource | Path |
|----------|------|
| Workflow file | `.github/workflows/local-folder-analysis.yml` |
| Approved folders config | `config/runner.yaml` |
| Scan script | `automation/scripts/Scan-LocalFolder.ps1` |
| W-11 workflow definition | `automation/workflows/w-11-desktop-file-review.md` |
| A-14 agent definition | `automation/agents/desktop-file-hygiene-agent.md` |
| Approvals config | `config/approvals.yaml` (W-11 gate: BLOCKED) |
| GitHub runner documentation | https://docs.github.com/en/actions/hosting-your-own-runners |
