<#
.SYNOPSIS
    Read-only scan of an approved local folder — produces a DRAFT file listing.

.DESCRIPTION
    Called by .github/workflows/local-folder-analysis.yml on a Windows
    self-hosted runner.

    This script:
      1. Validates that the requested folder alias is defined and enabled in
         config/runner.yaml.
      2. Resolves the real folder path from a runner environment variable
         (never from this script or any committed file).
      3. Performs a read-only recursive file-metadata scan up to MaxDepth.
      4. Writes a Markdown DRAFT listing to /data/inbox/.

    SAFETY GUARANTEES
      - No file is read, opened, moved, renamed, or deleted.
      - Only metadata is captured: name, type, extension, size, last-modified.
      - Output is always marked DRAFT and requires human review (W-11 Step 7).
      - File count is capped at the limit defined in config/runner.yaml
        (default: 500, matching system.yaml safety_limits).

    SOURCE / AGENT / WORKFLOW TRACEABILITY
      Source:   Scan-LocalFolder.ps1
      Agent:    A-14 Desktop and File Hygiene Agent
      Workflow: W-11 Desktop and File Intake Review

.PARAMETER FolderAlias
    Short alias for the folder to scan. Must match an entry in the
    approved_folders section of ConfigFile with enabled: true.

.PARAMETER MaxDepth
    Maximum folder depth to scan (1 = top level only, 1–5).

.PARAMETER OutputDir
    Directory where the Markdown output file will be written.
    Typically: <workspace>\data\inbox

.PARAMETER ConfigFile
    Path to config/runner.yaml, which defines approved folder aliases.

.PARAMETER RunNotes
    Optional free-text note from the human operator to include in the output.

.PARAMETER RunId
    GitHub Actions run ID, used to create a unique output filename.

.EXAMPLE
    .\Scan-LocalFolder.ps1 `
        -FolderAlias   "desktop" `
        -MaxDepth       3 `
        -OutputDir      "C:\repo\data\inbox" `
        -ConfigFile     "C:\repo\config\runner.yaml" `
        -RunNotes       "Weekly hygiene check" `
        -RunId          "12345678"
#>

#Requires -Version 7.0

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[a-zA-Z0-9_-]+$')]
    [string] $FolderAlias,

    [Parameter(Mandatory)]
    [ValidateRange(1, 5)]
    [int]    $MaxDepth,

    [Parameter(Mandatory)]
    [string] $OutputDir,

    [Parameter(Mandatory)]
    [string] $ConfigFile,

    [string] $RunNotes = "",
    [string] $RunId    = "local"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ─── Helpers ──────────────────────────────────────────────────────────────────

function Get-YamlScalar {
    <#
    .SYNOPSIS
        Extracts a scalar value for a given key from a simple YAML block.
        Works without an external YAML module.
    #>
    param([string] $Content, [string] $Key)
    $pattern = "^\s*${Key}:\s*[`"']?([^`"'#\r\n]+)[`"']?\s*$"
    $match    = [regex]::Match($Content, $pattern, 'Multiline')
    if ($match.Success) { return $match.Groups[1].Value.Trim() }
    return $null
}

# ─── 1. Load and validate config ──────────────────────────────────────────────

if (-not (Test-Path $ConfigFile -PathType Leaf)) {
    Write-Error "Config file not found: $ConfigFile"
    exit 1
}

$configRaw = Get-Content $ConfigFile -Raw

# Locate the block for this alias inside the approved_folders section.
# Pattern: match from '  <alias>:' to the next same-level key or end of section.
$blockPattern = "(?ms)^\s{2}${FolderAlias}:\r?\n((?:\s{4,}[^\r\n]*\r?\n?)*)"
$blockMatch   = [regex]::Match($configRaw, $blockPattern)

if (-not $blockMatch.Success) {
    Write-Error "Folder alias '$FolderAlias' is not defined in $ConfigFile. " +
                "Add it to the approved_folders section before using."
    exit 1
}

$block   = $blockMatch.Groups[1].Value
$envVar  = Get-YamlScalar -Content $block -Key 'env_var'
$enabled = Get-YamlScalar -Content $block -Key 'enabled'

if ([string]::IsNullOrWhiteSpace($envVar)) {
    Write-Error "Could not read env_var for alias '$FolderAlias' from $ConfigFile."
    exit 1
}

if ($enabled -ne 'true') {
    Write-Error ("Folder alias '$FolderAlias' is not enabled in $ConfigFile. " +
                 "Set enabled: true for this alias before running a scan. " +
                 "This requires a human operator change and commit.")
    exit 1
}

# ─── 2. Resolve folder path from environment variable ─────────────────────────

$folderPath = [System.Environment]::GetEnvironmentVariable($envVar)

if ([string]::IsNullOrWhiteSpace($folderPath)) {
    Write-Error ("Environment variable '$envVar' is not set on this runner. " +
                 "Set it as a System environment variable on the runner machine. " +
                 "See docs/operations/windows-runner-setup.md for instructions.")
    exit 1
}

# Normalise path (resolve any trailing slashes or relative segments)
$folderPath = [System.IO.Path]::GetFullPath($folderPath)

if (-not (Test-Path $folderPath -PathType Container)) {
    Write-Error "Folder path from '$envVar' does not exist or is not a directory: $folderPath"
    exit 1
}

# ─── 3. Read scan limits from config ─────────────────────────────────────────

$limitsPattern = "(?ms)^scan_limits:\r?\n((?:\s+[^\r\n]*\r?\n?)*)"
$limitsMatch   = [regex]::Match($configRaw, $limitsPattern)
$maxFiles      = 500   # default — matches system.yaml

if ($limitsMatch.Success) {
    $limitsBlock = $limitsMatch.Groups[1].Value
    $parsed      = Get-YamlScalar -Content $limitsBlock -Key 'max_files_per_scan'
    if ($parsed -match '^\d+$') { $maxFiles = [int]$parsed }
}

# ─── 4. Perform read-only scan ────────────────────────────────────────────────

Write-Output "======================================================================"
Write-Output "  Local Folder Analysis — Scan-LocalFolder.ps1"
Write-Output "  Agent:    A-14 Desktop and File Hygiene Agent"
Write-Output "  Workflow: W-11 Desktop and File Intake Review"
Write-Output "  Status:   READ-ONLY — no files will be modified"
Write-Output "======================================================================"
Write-Output ""
Write-Output "  Alias:      $FolderAlias"
Write-Output "  Max depth:  $MaxDepth"
Write-Output "  Max files:  $maxFiles"
Write-Output ""

$items     = [System.Collections.Generic.List[PSCustomObject]]::new()
$truncated = $false

function Invoke-FolderScan {
    param([string] $Path, [int] $Depth)

    if ($Depth -gt $MaxDepth)              { return }
    if ($script:items.Count -ge $maxFiles) { $script:truncated = $true; return }

    $entries = Get-ChildItem -LiteralPath $Path -Force:$false -ErrorAction SilentlyContinue |
               Sort-Object -Property @{E={$_.PSIsContainer}; Descending=$true}, Name

    foreach ($entry in $entries) {
        if ($script:items.Count -ge $maxFiles) { $script:truncated = $true; break }

        $relativePath = $entry.FullName.Substring($folderPath.Length).TrimStart('\/')

        $script:items.Add([PSCustomObject]@{
            Depth        = $Depth
            Name         = $entry.Name
            Kind         = if ($entry.PSIsContainer) { 'Folder' } else { 'File' }
            Extension    = if ($entry.PSIsContainer) { '' } else { $entry.Extension.ToLower() }
            SizeKB       = if ($entry.PSIsContainer) { '' } else { [math]::Round($entry.Length / 1KB, 1).ToString() }
            LastModified = $entry.LastWriteTime.ToString('yyyy-MM-dd HH:mm')
            RelativePath = $relativePath
        })

        if ($entry.PSIsContainer) {
            Invoke-FolderScan -Path $entry.FullName -Depth ($Depth + 1)
        }
    }
}

Invoke-FolderScan -Path $folderPath -Depth 1

$totalItems = $items.Count
Write-Output "  Items found: $totalItems$(if ($truncated) { ' (truncated at limit)' })"
Write-Output ""

# ─── 5. Build Markdown output ────────────────────────────────────────────────

$timestamp  = Get-Date -Format 'yyyy-MM-dd HH:mm'
$datestamp  = Get-Date -Format 'yyyy-MM-dd'
$outputFile = Join-Path $OutputDir "scan-${FolderAlias}-${datestamp}-${RunId}.md"

$sb = [System.Text.StringBuilder]::new()

[void]$sb.AppendLine("# File Listing Draft — $FolderAlias")
[void]$sb.AppendLine()
[void]$sb.AppendLine("| Field | Value |")
[void]$sb.AppendLine("|-------|-------|")
[void]$sb.AppendLine("| **Source** | Scan-LocalFolder.ps1 |")
[void]$sb.AppendLine("| **Agent** | A-14 Desktop and File Hygiene Agent |")
[void]$sb.AppendLine("| **Workflow** | W-11 Desktop and File Intake Review |")
[void]$sb.AppendLine("| **Date** | $timestamp |")
[void]$sb.AppendLine("| **Status** | DRAFT — human review required before any action |")
[void]$sb.AppendLine("| **Approved by** | [PENDING — human approval required] |")
[void]$sb.AppendLine("| **Folder alias** | ``$FolderAlias`` |")
[void]$sb.AppendLine("| **Scan depth** | $MaxDepth |")
[void]$sb.AppendLine("| **Total items** | $totalItems$(if ($truncated) { ' ⚠ TRUNCATED at limit' }) |")
[void]$sb.AppendLine("| **Run ID** | $RunId |")

if (-not [string]::IsNullOrWhiteSpace($RunNotes)) {
    [void]$sb.AppendLine("| **Operator notes** | $RunNotes |")
}

[void]$sb.AppendLine()

if ($truncated) {
    [void]$sb.AppendLine("> ⚠ **TRUNCATED:** The scan reached the $maxFiles-item limit before completing.")
    [void]$sb.AppendLine("> Reduce scan depth or narrow the folder alias to get a complete listing.")
    [void]$sb.AppendLine()
}

[void]$sb.AppendLine("---")
[void]$sb.AppendLine()
[void]$sb.AppendLine("## File Listing")
[void]$sb.AppendLine()
[void]$sb.AppendLine("| # | Indent | Name | Kind | Ext | Size (KB) | Last Modified | Relative Path |")
[void]$sb.AppendLine("|---|--------|------|------|-----|-----------|---------------|---------------|")

$i = 1
foreach ($item in $items) {
    $indent = '·· ' * ($item.Depth - 1)
    [void]$sb.AppendLine("| $i | $($item.Depth) | ${indent}$($item.Name) | $($item.Kind) | $($item.Extension) | $($item.SizeKB) | $($item.LastModified) | $($item.RelativePath) |")
    $i++
}

[void]$sb.AppendLine()
[void]$sb.AppendLine("---")
[void]$sb.AppendLine()
[void]$sb.AppendLine("## Confidence Markers")
[void]$sb.AppendLine()
[void]$sb.AppendLine("- **[CONFIRMED]** File metadata above is taken directly from the filesystem.")
[void]$sb.AppendLine("- **[INFERRED]** File purpose and category tags must be assigned by A-14 in the next W-11 step.")
[void]$sb.AppendLine("- **[MISSING]** File content is not read — no content-based classification is possible from this listing alone.")
[void]$sb.AppendLine()
[void]$sb.AppendLine("---")
[void]$sb.AppendLine()
[void]$sb.AppendLine("## Next Steps (W-11)")
[void]$sb.AppendLine()
[void]$sb.AppendLine("This listing is a **DRAFT**. No files have been moved, deleted, or modified.")
[void]$sb.AppendLine()
[void]$sb.AppendLine("1. Place this file in ``data/inbox/`` in your local repository checkout.")
[void]$sb.AppendLine("2. A-01 assigns analysis to A-14 (W-11 Step 2).")
[void]$sb.AppendLine("3. A-14 classifies each file with a tag: ``[KEEP]``, ``[ARCHIVE]``, ``[REVIEW]``, ``[DUPLICATE-CANDIDATE]``, ``[SENSITIVE]``, ``[EMPTY-OR-PLACEHOLDER]``.")
[void]$sb.AppendLine("4. Human reviews classification and routing plan (W-11 Step 7 — **GATE**).")
[void]$sb.AppendLine("5. Every file action requires individual human approval.")
[void]$sb.AppendLine("   Approval level: **BLOCKED** for any automated execution (see ``config/approvals.yaml``).")

# ─── 6. Write output file ─────────────────────────────────────────────────────

if (-not (Test-Path $OutputDir -PathType Container)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Output "  Created output directory: $OutputDir"
}

$sb.ToString() | Set-Content -LiteralPath $outputFile -Encoding UTF8

Write-Output "  Output written to: $outputFile"
Write-Output ""
Write-Output "======================================================================"
Write-Output "  STATUS: DRAFT — human review required"
Write-Output "  No files were read, moved, renamed, or deleted during this scan."
Write-Output "======================================================================"
