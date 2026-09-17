# AI-DLC Project (Claude Code) — Bilingual KO/EN

This project runs AI-DLC (AI-Driven Development Lifecycle) with Claude Code.

When you receive a software development request, FIRST read
`.aidlc-rule-details/core-workflow.md` and follow that workflow before any default workflow.

- Rule details are under `.aidlc-rule-details/` (common/, inception/, construction/, operations/, extensions/).
- Put clarifying questions in separate question files (.md); proceed only after the user's [Answer]: responses and explicit approval.
- **Respond in the SAME language the user writes in (Korean or English).** Keep code and technical terms unchanged.
- Requirements are provided in both languages — use the one the user points to:
  - Korean : requirements/hr-portal-requirements-ko.md  (+ hr-portal-constraints-ko.md)
  - English: requirements/hr-portal-requirements-en.md  (+ hr-portal-constraints-en.md)
- Save all artifacts under `aidlc-docs/`, and log decisions in `audit.md`.
