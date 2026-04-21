# Calendar Availability Report — Bell Work Schedule

**Document:** `/docs/analysis/calendar-availability-report.md`
**Task:** W-13 Personal Task Execution — Calendar Image Analysis
**Agent:** A-10 Calendar and Scheduling Agent
**Date:** 2026-04-21
**Status:** [PARTIAL — Source inaccessible from current environment]

---

## 1. Source Accessibility Status

| Source | Expected Location | Status | Reason |
|--------|-----------------|--------|--------|
| Schedule images | User's local Downloads folder | ❌ NOT ACCESSIBLE | This system operates in a GitHub Actions sandbox. The local Downloads folder on your personal machine is not reachable from this environment. No images were found or analyzed. |

**This is not a task failure. It is an environment constraint that must be resolved before image analysis can occur.**

---

## 2. What the System Can Do vs. What It Needs

### What is possible within this system (Orchestrator_main):
- Analyze schedule images **once they are placed in `/data/inbox/` within this repository**
- Structure and classify occupancy data from images or manual input
- Produce calendar analysis reports and route scheduling items to A-10

### What is required from you to complete this task:
One of the following steps must be taken **locally**, outside this system:

**Option A — Upload images to the repository inbox:**
1. Copy your Bell schedule images from your Downloads folder
2. Place them in `/data/inbox/calendar/` within this repository
3. Commit and push them
4. Re-run this task — the system will then analyze them

**Option B — Manual text input (fastest):**
1. Open each image on your local machine
2. Note the key information (dates, days, your name/assignment highlighted)
3. Create a plain text or markdown file in `/data/inbox/calendar/[YYYY-MM-DD]-bell-schedule.md`
4. Format it as a simple table or list — A-10 will structure it from there

**Option C — Direct entry (if you know your schedule):**
Fill in the template in Section 4 of this document directly and place the result in `/data/drafts/`.

---

## 3. What the Analysis Would Produce (Output Format)

When images or input data are available, the analysis will produce:

```
FILE ANALYZED:
  Filename: [filename]
  Date modified: [date]
  Image type: [jpg/png/webp]
  Confidence: [High/Medium/Low/Very Low]

DATES DETECTED:
  [Day] [Date]: [OCCUPIED / FREE / UNCERTAIN]
  ...

OCCUPIED DAYS (confirmed):
  [List]

LIKELY FREE DAYS:
  [List]

AMBIGUOUS / UNCLEAR:
  [List with reason]
```

---

## 4. Input Template for Manual Entry

Use this template to capture your Bell schedule manually:

```markdown
# Bell Work Schedule — [Month] [Year]

**Job:** Bell — Deputy Lead, Grill and Event Team
**Schedule type:** Shift roster / Duty plan

| Date | Day | Shift / Assignment | Start Time | End Time | Notes |
|------|-----|-------------------|-----------|---------|-------|
| DD.MM | Monday | [role/shift name] | HH:MM | HH:MM | e.g. Grill Lead |
| DD.MM | Tuesday | OFF | — | — | — |
...

**Summary:**
- Total occupied days this period: [n]
- Days with early shifts: [list]
- Days with late shifts: [list]
- Free days: [list]
```

---

## 5. Blocked Days Identification Logic

When images are analyzed, the system will flag a day as **occupied** if any of the following appear:

- Your name, initials, or identifier appears in that date cell
- A role abbreviation (e.g. "EL", "Grill", "Lead", "GL", "Dep") is visible on that date
- A shift marker (color, symbol, hour notation) is present
- Any cell is clearly filled/highlighted vs. blank for that date

A day is flagged **likely free / not visibly assigned** when:

- The cell for that date is blank
- The cell shows "OFF", "U", "frei", or a dash
- No role or time notation is visible

A day is marked **ambiguous** when:

- OCR/image quality prevents reliable reading
- The cell is partially obscured, cropped, or very small
- Multiple overlapping notations appear unclear

---

## 6. Next Action Required

**Priority:** HIGH — This analysis cannot proceed without you providing the image files or manual data.

**Recommended action:**

```
1. On your local machine, open your Downloads folder
2. Identify the Bell schedule image(s)
3. Choose Option A (upload to repo) or Option B (manual note) from Section 2
4. Notify the system once input is in place
5. Re-run this task — full analysis will be completed in the next run
```

---

## 7. Escalation Status

```
STATUS: BLOCKED — Awaiting input
REASON: Source data (schedule images) is on local machine, not in this system
REQUIRED ACTION: Human operator must transfer images or data into /data/inbox/calendar/
ASSIGNED AGENT: A-10 Calendar and Scheduling Agent (on standby)
```
