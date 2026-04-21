# Communications Operating Model

## How Business Communications Are Drafted, Reviewed, and Approved

---

## 1. Purpose

This document defines how all business communications — email replies, LinkedIn posts, outreach messages, and status updates — are handled within the system. All communications start as drafts and are never sent automatically.

---

## 2. Core Rule

**Draft-before-send is absolute.** No communication is sent, published, or shared without explicit human review and approval. This applies to every communication type without exception.

---

## 3. Communication Types and Handling

| Communication Type | Agent | Draft Location | Send/Publish |
|---|---|---|---|
| Email reply | A-09 Email Triage Agent | `data/drafts/email/` | Human sends manually |
| LinkedIn post | A-12 Communication Agent | `data/drafts/communications/` | Human publishes manually |
| LinkedIn outreach | A-12 Communication Agent | `data/drafts/communications/` | Human sends manually |
| Business status update | A-12 Communication Agent | `data/drafts/communications/` | Human sends manually |
| Client follow-up | A-09 + A-12 | `data/drafts/email/` | Human sends manually |
| Calendar invite | A-10 Calendar Agent | `data/drafts/calendar/` | Human sends manually |
| Meeting prep note | A-10 Calendar Agent | `data/drafts/calendar/` | Human uses as reference |

---

## 4. Draft Preparation Process

1. Agent receives context (email batch, communication request, or triggered workflow)
2. Agent classifies the communication type and tone
3. Agent produces a draft using the appropriate prompt from `/automation/prompts/`
4. Draft is stored in the correct `/data/drafts/` subfolder
5. Draft is flagged for human review in the next briefing or approval queue
6. Human reviews, edits, and approves or rejects
7. If approved: human sends manually
8. Approval is recorded in the relevant handoff file

---

## 5. Tone and Adaptation Guidelines

The Communication Agent (A-12) adapts tone based on:

| Context | Tone |
|---|---|
| Client email | Professional, clear, concise |
| LinkedIn post | Business-appropriate, engaging, authentic |
| LinkedIn outreach | Respectful, personalized, not generic |
| Internal summary | Factual, direct |
| Follow-up reminder | Polite, specific about the ask |

Tone adaptation is based on context provided by the human operator. The agent does not invent relationship context.

---

## 6. Prohibited Communication Actions

- No agent sends any communication directly
- No agent accesses email credentials or email APIs
- No agent posts to any social platform
- No template is used without human review of the specific instance
- No communication is sent without an approval record

---

## 7. Communication Quality Standards

Every drafted communication must:

- Have a clear subject or purpose
- Reference the specific context it is responding to
- Avoid invented facts or assumed relationships
- Be clearly marked as `[DRAFT]` in the file header
- Include the source context (email thread, LinkedIn profile, meeting request)

---

## 8. Follow-up Tracking

When the Email Triage Agent (A-09) detects follow-up needs:

1. Follow-up item is logged with: contact, topic, due date, original context
2. Item appears in daily briefing under "Pending Follow-ups"
3. Communication Agent (A-12) prepares a draft if instructed
4. Human reviews and sends

Follow-up items that are not resolved within 3 business days are escalated in the briefing.
