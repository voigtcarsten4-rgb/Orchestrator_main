# Local Folder Activation — Operator Checklist

**Document type:** Operations — Checklist  
**Scope:** First-time activation and test run of the local folder analysis workflow  
**Last updated:** 2026-04-21

Use this checklist each time you activate a new folder alias or run a first
scan after machine reconfiguration. Complete every step in order.

---

## Step 1 — Confirm Runner is Online

1. Navigate to:  
   `https://github.com/voigtcarsten4-rgb/Orchestrator_main/settings/actions/runners`
2. Confirm the self-hosted Windows runner shows status **Idle**.

If the runner is **Offline**:
- Open an elevated PowerShell prompt on the runner machine
- Run `cd C:\actions-runner` (or your runner installation path)
- Run `.\svc.cmd status`
- If stopped, run `.\svc.cmd start`
- Refresh the GitHub page and confirm **Idle**

---

## Step 2 — Set Local Environment Variables on Windows

For each alias you want to activate, set the corresponding System environment
variable on the runner machine.

**Open an elevated PowerShell prompt and run:**

```powershell
# For himmelreich — replace the path with the real folder path
[System.Environment]::SetEnvironmentVariable(
  "HIMMELREICH_PATH",
  "C:\<actual-path>",
  [System.EnvironmentVariableTarget]::Machine
)

# For downloads — replace the path with the real folder path
[System.Environment]::SetEnvironmentVariable(
  "DOWNLOADS_PATH",
  "C:\Users\<username>\Downloads",
  [System.EnvironmentVariableTarget]::Machine
)
```

**Verify:**

```powershell
[System.Environment]::GetEnvironmentVariable("HIMMELREICH_PATH", "Machine")
[System.Environment]::GetEnvironmentVariable("DOWNLOADS_PATH", "Machine")
```

Each command should return the path you set. If it returns empty, repeat the
`SetEnvironmentVariable` step.

---

## Step 3 — Verify Alias Configuration in `config/runner.yaml`

1. Open `config/runner.yaml` in the repository.
2. Confirm the alias you want to scan has `enabled: true`.  
   If it shows `enabled: false`, change it, commit, and push.

Example — enabling `himmelreich`:
```yaml
  himmelreich:
    alias: "himmelreich"
    env_var: "HIMMELREICH_PATH"
    description: "Himmelreich project folder"
    enabled: true   # <-- must be true
```

3. Confirm the `env_var` field matches the variable you set in Step 2.
4. Commit and push if you made any changes.

---

## Step 4 — Restart the Runner

The runner service must be restarted after every change to System environment
variables. Without a restart, the runner process will not see the new values.

```powershell
# Elevated PowerShell, from the runner installation directory
.\svc.cmd stop
.\svc.cmd start
```

After restarting, confirm the runner shows **Idle** again on the GitHub
settings page before proceeding.

---

## Step 5 — Run the Local Folder Analysis Workflow

1. Go to: `https://github.com/voigtcarsten4-rgb/Orchestrator_main/actions`
2. Click **Local Folder Analysis (W-11)** in the left panel.
3. Click **Run workflow** (top right).
4. Fill in the inputs:
   - `folder_alias`: enter `himmelreich` or `downloads`
   - `scan_depth`: enter `2` for the first run (shallow scan)
   - `run_notes`: enter a brief reason (e.g. "first activation test")
5. Click the green **Run workflow** button.
6. Monitor the run — it should complete within a few minutes on the self-hosted runner.

If the run fails:
- Click the failed job to see error output
- Common causes: env var not set, alias not enabled, runner not restarted after env var change

---

## Step 6 — Inspect DRAFT Output

After the workflow completes successfully:

**Option A — Download the artifact:**
1. Open the completed workflow run.
2. Scroll to the **Artifacts** section at the bottom.
3. Download `folder-scan-<alias>-<run_id>.zip`.
4. Extract and open the `.md` file.

**Option B — Check `data/inbox/` on the runner machine:**
The scan script also writes the file to `data/inbox/` in the runner's workspace
(typically `C:\actions-runner\_work\Orchestrator_main\Orchestrator_main\data\inbox\`).

**What to verify in the output:**
- Header table shows the correct alias, date, and DRAFT status
- File listing contains entries from the expected folder
- No unexpected system paths or sensitive filenames are listed
- Item count is reasonable for the folder scanned
- Footer shows "No files were read, moved, renamed, or deleted"

**If everything looks correct:**
Proceed to W-11 Step 2 in `automation/workflows/w-11-desktop-file-review.md`
to begin the classification phase with A-14.

---

## Completion Criteria

- [ ] Runner is online (Idle) before each scan
- [ ] Environment variable is set and verified before enabling alias
- [ ] Alias has `enabled: true` in `config/runner.yaml`
- [ ] Runner restarted after env var change
- [ ] Workflow completes without errors
- [ ] DRAFT output file downloaded and reviewed by human operator
- [ ] No real paths, credentials, or tokens observed in the output
