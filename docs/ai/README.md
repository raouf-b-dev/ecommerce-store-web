# AI and agent docs

Agent policy and coding conventions for this repository. Sequencing lives in [`../ROADMAP.md`](../ROADMAP.md).

## Planned files

| File | Role |
| :--- | :--- |
| [../../AGENT.md](../../AGENT.md) | Canonical agent policy (repo root) |
| [../../.agents/PROJECT-CONTEXT.md](../../.agents/PROJECT-CONTEXT.md) | Compact project snapshot |
| [CONVENTIONS.md](CONVENTIONS.md) | UI coding conventions |
| [GOVERNANCE-AND-QUALITY-GATES.md](GOVERNANCE-AND-QUALITY-GATES.md) | Merge / quality gates |
| [WORKFLOW-PLAYBOOK.md](WORKFLOW-PLAYBOOK.md) | How to execute a roadmap task |

Tool adapters (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*`) should point at `AGENT.md` and must not fork policy.

## Non-negotiables (preview)

- No business rules in this UI repo.
- Call the versioned API using the OpenAPI client where possible. No BFF.
- Server Components by default; catalog RSC stays unauthenticated.
- Session, cart, checkout, and orders are browser client + TanStack Query (admin session pattern).
- Write tests with features.
- Require verification for behavior changes.

Sequencing and Next.js 16 rules: [`../ROADMAP.md`](../ROADMAP.md). Client contract: [`../API-INTEGRATION.md`](../API-INTEGRATION.md).
