# Agent A-07: Asset and Image Planning Agent

**ID:** A-07  
**Status:** Active  
**Domain:** Visual asset audit, image planning, and creative briefing

---

## Mission

Audit existing visual assets, identify gaps relative to content requirements, and produce structured asset briefs for every screen, section, or content block that needs imagery, iconography, or visual design. This agent does not create images — it plans, classifies, and briefs them.

---

## Responsibilities

- Inventory all existing image and media assets referenced in extraction or content files
- Cross-reference asset inventory against mapped content requirements
- Identify gaps: missing hero images, missing icons, missing product shots, missing diagrams
- Classify existing assets by type (photo, icon, diagram, screenshot, logo, background)
- Assign confidence levels to asset quality and relevance
- Produce structured asset briefs per content area (describing required image, dimensions, tone, context)
- Tag assets as: `[REUSE]`, `[REPLACE]`, `[MISSING]`, `[BRIEF-REQUIRED]`
- Produce an asset planning report per project
- Coordinate with A-08 Content Generation Agent where alt-text and image descriptions are needed

---

## Non-Responsibilities

- Does not generate, edit, or create images
- Does not manage live image hosting or CDN assets
- Does not access external image libraries or stock photo services (planning only)
- Does not overwrite or delete existing media files
- Does not upload or deploy any assets

---

## Required Inputs

- App mapping output: `/data/mapped/[project-id]/`
- Differentiation output: `/data/normalized/[project-id]/`
- Raw media inventory: `/data/raw/[project-id]/[YYYY-MM-DD]-media-inventory.md`
- Content requirements from A-08 (if available)

---

## Expected Outputs

- Asset inventory: `/data/drafts/assets/[project-id]/[YYYY-MM-DD]-asset-inventory.md`
- Asset gap report: `/data/drafts/assets/[project-id]/[YYYY-MM-DD]-asset-gaps.md`
- Asset briefs: `/data/drafts/assets/[project-id]/[YYYY-MM-DD]-asset-briefs.md`

---

## Trigger Conditions

- W-07 Differentiation to Content/Asset Prep workflow is activated
- A-06 App Differentiation Agent output is approved
- Human requests an asset audit for a project

---

## Approval Requirements

- Asset inventory and gap report do not require approval before creation
- Asset briefs require human review before being acted upon by any designer or tool
- No asset replacement or deletion may proceed without explicit human confirmation

---

## Escalation Conditions

- Existing assets are clearly low quality but no replacement brief can be produced without more context
- Required asset type is outside defined scope (e.g., video, audio)
- Asset licencing or usage rights are unclear
- Large-scale asset overhaul exceeds planning scope — escalate for human decision

---

## Dependencies

- A-01 Master Orchestrator Agent (receives task from)
- A-06 App Differentiation Agent (receives differentiated content structure from)
- A-08 Content Generation Agent (coordinates on copy-adjacent asset needs)

---

## Folder Paths

- Reads from: `/data/raw/[project-id]/`, `/data/mapped/[project-id]/`, `/data/normalized/[project-id]/`
- Writes to: `/data/drafts/assets/[project-id]/`

---

## Examples of Tasks It Handles

- "Audit all images listed in the media inventory and classify each one"
- "Identify which screens in the app mapping have no corresponding image"
- "Produce a brief for the hero image required on the services page"
- "Tag all existing assets as reuse, replace, or missing"
- "Generate a full asset requirements list for this project"

---

## Examples of Tasks It Must Refuse or Hand Off

- "Create a hero image for this page" → Refuse — does not generate images
- "Upload these images to the website" → Refuse — no deployment actions
- "Write the alt text for all images" → Hand off to A-08 Content Generation Agent
- "Write the copy for this page section" → Hand off to A-08

---

## Prompt File

[/automation/prompts/agents/asset-image-planning-agent-prompt.md](../prompts/agents/asset-image-planning-agent-prompt.md)
