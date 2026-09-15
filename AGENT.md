# Agent Governance and Development Policy

This is the canonical repository policy for AI-assisted development in `ecommerce-store-web`.

## 1. Order of Authority

When instructions conflict, resolve in this order:

1. Direct human task instruction for the active work.
2. This `AGENT.md` policy.
3. Canonical docs in `docs/`.
4. Tool-specific adapters (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*`).

## 2. Canonical References

- Project context: [`.agents/PROJECT-CONTEXT.md`](.agents/PROJECT-CONTEXT.md)
- UI conventions: [`docs/ai/CONVENTIONS.md`](docs/ai/CONVENTIONS.md)
- Quality gates: [`docs/ai/GOVERNANCE-AND-QUALITY-GATES.md`](docs/ai/GOVERNANCE-AND-QUALITY-GATES.md)
- Workflow: [`docs/ai/WORKFLOW-PLAYBOOK.md`](docs/ai/WORKFLOW-PLAYBOOK.md)
- Security baseline: [`SECURITY.md`](SECURITY.md)
- API integration rules: [`docs/API-INTEGRATION.md`](docs/API-INTEGRATION.md)
- Architecture: [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)
- Delivery sequence: [`docs/ROADMAP.md`](docs/ROADMAP.md)

## 3. Context First

Before starting feature work, read `.agents/PROJECT-CONTEXT.md` for the current stack, directory map, rendering split, and API integration notes.

## 4. Non-Negotiables

1. No business rules in this repo. Pricing, stock, checkout, auth, and permissions stay in `ecommerce-store-api`.
2. Call only the versioned API surface documented in OpenAPI (plus documented unversioned health if needed).
3. Prefer the OpenAPI client over ad-hoc `fetch` wrappers for domain calls. RSC catalog fetchers still use generated types and paths, not a second untyped dialect.
4. Require verification evidence for behavior changes.
5. Do not push, publish, or change production config without explicit user confirmation.
6. If the API contract is wrong, fix it in `ecommerce-store-api`. Do not paper over it here.
7. Docs and comments use ASCII punctuation only (hyphens, straight quotes, `...`). No em dashes, curly quotes, or other smart typography. See [`docs/ai/CONVENTIONS.md`](docs/ai/CONVENTIONS.md) §11.

## 5. Conventions Rule

All implementation and refactor work must apply [`docs/ai/CONVENTIONS.md`](docs/ai/CONVENTIONS.md).

At minimum, that includes:

- Server Components by default; `"use client"` only for interactivity
- two HTTP clients (browser vs `server-only`)
- feature folder layout without barrels
- query keys, forms, and RFC 9110 error mapping when those layers exist
- ASCII punctuation in docs and comments (`CONVENTIONS` §11)

## 6. Execution Lifecycle

Use this sequence for work:

1. Intake
2. Plan
3. Execute
4. Verify
5. Handoff

Escalate when security, auth/session behavior, API contract meaning, or data integrity is unclear.
