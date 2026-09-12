# Architecture Decision Records (ADRs)

---

Document Type: Reference and Index
Audience: Frontend engineers and reviewers
Status: Active

---

This directory records Architecture Decision Records for `ecommerce-store-web`.

## What is an ADR?

An ADR captures a single significant architectural decision: context, rationale, alternatives, and consequences.

ADRs are **immutable historical documents**. They record _why_ a decision was made at a specific point in time.

**Do not rewrite or amend the body** of an existing ADR (sections such as Context, Decisions, Alternatives, Consequences).

### What may change later

| Allowed                                                                          | Not allowed                                       |
| :------------------------------------------------------------------------------- | :------------------------------------------------ |
| File header **Status** (`Proposed` -> `Accepted` -> `Deprecated` / `Superseded`) | Rewriting Decisions / Alternatives / Consequences |
| Optional header **Superseded By** / **Supersedes** links when lifecycle changes  | Quietly amending the original decision in place   |
| This **index** table (status, supersedes, superseded-by)                         | Deleting historical ADRs                          |

If a decision changes or is extended:

1. **Write a new ADR** (`ADR-XXXX-[short-title].md`).
2. Link the prior ADR from the new record (`Context` / `Does not supersede` / `Supersedes`: same style as API ADRs).
3. Update this **index**.
4. **Full replacement only:** set the old ADR header **Status** to `Superseded` and add **Superseded By: ADR-XXXX**. Leave the rest of the old file untouched.
5. **Extension only** (new ADR adds behavior; prior decisions still stand): leave the old ADR **Accepted**; new ADR uses **Does not supersede**.

## Lifecycle states

| Status       | Meaning                                           |
| :----------- | :------------------------------------------------ |
| `Proposed`   | Written during design; awaiting approval          |
| `Accepted`   | Approved and in effect                            |
| `Deprecated` | No longer recommended                             |
| `Superseded` | Replaced by a later ADR (must link the successor) |

## Naming standard

`ADR-XXXX-[short-title].md` (four-digit zero-padded number).

## ADR index

| ADR                                                                         | Status   | Summary                                                                             | Date       | Supersedes | Superseded By |
| :-------------------------------------------------------------------------- | :------- | :---------------------------------------------------------------------------------- | :--------- | :--------- | :------------ |
| [ADR-0001](ADR-0001-rsc-catalog-browser-session-no-bff.md)                  | Accepted | RSC public catalog; browser client for session/mutations; no BFF                    | 2026-09-07 | -          | -             |
| [ADR-0002](ADR-0002-in-memory-access-token-with-httponly-refresh-cookie.md) | Accepted | Access token in memory; refresh via HttpOnly cookie; no `localStorage` tokens       | 2026-09-07 | -          | -             |
| [ADR-0003](ADR-0003-single-flight-silent-refresh.md)                        | Accepted | Silent one-shot refresh + single-flight on domain 401                               | 2026-09-07 | -          | -             |
| [ADR-0004](ADR-0004-no-guest-cart.md)                                       | Accepted | No guest line-item basket; login gate on cart and checkout                          | 2026-09-07 | -          | -             |
| [ADR-0005](ADR-0005-checkout-order-polling.md)                              | Proposed | Checkout completion is own-order polling, not a job-queue API                       | 2026-09-07 | -          | -             |
| [ADR-0006](ADR-0006-security-headers-and-client-auth.md)                    | Accepted | Security headers in `next.config.ts`; auth at the client session boundary           | 2026-09-07 | -          | -             |
| [ADR-0007](ADR-0007-keep-session-alive-for-refresh-token-lifetime.md)       | Accepted | Refresh missing or expiring in-memory access tokens for the refresh-cookie lifetime | 2026-09-07 | -          | -             |
| [ADR-0008](ADR-0008-resource-404-via-app-router.md)                         | Accepted | Missing resource URLs use App Router `notFound()` before streaming                  | 2026-09-10 | -          | -             |

Cross-link API ADRs when relevant; do not duplicate backend decision records here.
