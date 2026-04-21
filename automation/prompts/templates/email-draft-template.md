# Template: Email Draft

**Usage:** Used by A-09 (Email Triage and Drafting Agent) for all reply drafts.

---

## Email Draft Template

```
STATUS: [DRAFT — NOT SENT]
Date: [YYYY-MM-DD]
Agent: A-09 Email Triage and Drafting Agent
Source email: [Subject line and sender reference]

---

Subject: [Re: Original subject or new subject if applicable]

[Opening — 1 sentence acknowledging the email or context]

[Body — address the specific request, question, or action item in 2–3 short paragraphs]

[If a commitment or decision is required: FLAG → [REQUIRES HUMAN DECISION: describe what decision is needed]]

[Closing — clear next step or question]

[Sign-off]

---

TRACEABILITY
Source: [input file path]
Agent: A-09
Workflow: W-09
Date: [YYYY-MM-DD]
Status: draft
Approved by: N/A — human must approve before sending
```

---

## Usage Notes

- Replace all `[bracketed items]` before use
- All `[REQUIRES HUMAN DECISION]` flags must be resolved by the human operator before the email is sent
- Do not modify the STATUS header — it must remain `[DRAFT — NOT SENT]` until human explicitly approves and sends
- One draft per email requiring a reply
