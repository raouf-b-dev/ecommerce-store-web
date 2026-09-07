# Workflow Playbook

## 1. Intake

- Read the active task.
- Read `AGENT.md`.
- Read `.agents/PROJECT-CONTEXT.md`.
- Check whether the task maps cleanly to a roadmap item in [`docs/ROADMAP.md`](../ROADMAP.md).

## 2. Plan

- Identify the feature or foundation area being changed.
- Confirm the relevant OpenAPI capability and local client integration path (RSC vs browser).
- Decide the minimum test coverage needed for the change.

## 3. Execute

- Change the smallest set of files that satisfies the task.
- Keep API integration code centralized in feature `api/` modules or `src/lib/api/`.
- Keep UI and contract changes aligned.
- Do not add a BFF, guest line-item basket, or invented OpenAPI operations.

## 4. Verify

- Run lint, typecheck, unit tests, and any relevant manual checks.
- Run Playwright when the flow affects RSC routes or the shopper journey.
- If OpenAPI-driven code changed, regenerate with `npm run api:generate` against a live API.

## 5. Handoff

- Summarize what changed.
- Mention what was verified.
- Call out any deferred risks or follow-up items clearly.
