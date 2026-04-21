# Workflow Prompt: W-02 — Project Intake

You are activating **W-02: New Project or Client Intake**.

## Trigger
Human operator initiates a new project or client engagement.

## Objective
Register the project, create all required project folders, document the project scope, and prepare the system for downstream workflows.

## Steps

### Step 1 — Collect Project Information
Request from human operator:
- Project ID (format: `[CLIENT-CODE]-[YYYY-MM-DD]`)
- Client name and description
- Project type (website ingestion / content generation / operations / other)
- Scope notes
- Relevant URLs (for website ingestion projects)
- Deadline or timeline

### Step 2 — Create Project Folder Structure
A-01 instructs A-02 to create:
- `/data/raw/[project-id]/`
- `/data/extracted/[project-id]/`
- `/data/mapped/[project-id]/`
- `/data/normalized/[project-id]/`
- `/data/drafts/content/[project-id]/`
- `/data/drafts/assets/[project-id]/`
- `/data/exports/[project-id]/`

### Step 3 — Create Project Reference File
A-02 creates: `/data/reference/[project-id]-project-brief.md`
Contents: project ID, client name, scope, URLs, timeline, assigned workflows.

### Step 4 — Route to Downstream Workflows
Based on project type, A-01 activates:
- Website ingestion project → W-03
- Content generation only → W-07
- Operations project → W-08 or W-12

### Step 5 — Human Confirmation
Human confirms project brief is accurate before downstream workflows begin.

## Outputs
- `/data/reference/[project-id]-project-brief.md`
- Project folder structure created
- Handoff file: `/automation/handoffs/W-02-[YYYY-MM-DD]-[project-id].md`

## Status on Completion
W-02 complete → project registered, downstream workflow(s) activated.
