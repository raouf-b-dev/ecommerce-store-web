# ecommerce-store-web

Customer storefront for `ecommerce-store-api`. Next.js 16 App Router (Cache Components, React Compiler, typed routes), React 19, TypeScript (strict), TanStack Query, React Hook Form + Zod, Tailwind v4 + shadcn/ui, `openapi-fetch`. Vitest + Testing Library, Playwright. Node 24+.

## Verify

`npm run verify` runs lint (ESLint + ASCII prose), typecheck, and unit tests. Run it before reporting a task done. After touching routes, layouts, metadata, caching, or `next.config.ts`, also run `NEXT_PUBLIC_STOREFRONT_ORIGIN=https://storefront.test npm run build` (a production build rejects a missing or localhost origin; CI uses this value). One spec: `npx vitest run <path>`. Playwright (`npm run test:e2e`) needs a seeded live API: run it only for RSC routes or the shopper journey.

In your final message give: what changed, the commands you ran with results, and open risks or assumptions.

## Next.js docs

This is Next 16 and your training data may be older. For an API you are unsure about (Cache Components, `proxy`, typed routes, `next/form`, metadata), `rg` the bundled docs and open the one matching page under `node_modules/next/dist/docs/01-app/`. Never read the folder wholesale. `agentRules: false` in `next.config.ts` keeps `next dev` from rewriting this file; removing it makes `next dev` run from an agent session re-add Next's block here.

## Never

1. Use `as` assertions (except `as const`), `any`, or `@ts-ignore`. Narrow with type guards, Zod, annotations, and `satisfies` (tests: `write-tests` skill). The one allowed cast is Next's documented `as Route` for a runtime href (CONVENTIONS section 6). `eslint-suppressions.json` is a frozen baseline of older violations: never add entries. After fixing one run `npm run lint:prune`; `npm run lint:fix` exits 2 when it fixes a baselined violation, so run `lint:prune` then too. Avoid new `!` non-null assertions (not lint-enforced).
2. Write em or en dashes, curly quotes, or the ellipsis character in code, comments, or docs. Use ASCII (`-`, `'`, `"`, `...`); `docs/ai/CONVENTIONS.md` section 11.
3. Put domain rules in the UI, add a BFF (Route Handlers or Server Actions in front of the API), or work around a wrong API contract here: the fix goes in `ecommerce-store-api` (CONVENTIONS sections 1, 3, 9).
4. Break the rendering split in CONVENTIONS sections 3 and 4: one client per side (`server-client.ts` in RSC, `browser-client.ts` in Client Components), catalog stays RSC, `"use client"` only for interactivity.
5. Break the layout rules in CONVENTIONS section 2: `lib/` importing `features/` (ESLint enforces it), barrel `index.ts` files, one feature rendering another's chrome.
6. Match English error messages or invent fields the API does not return: use API `code` values and `src/lib/api/parse-api-error.ts`.
7. Store tokens outside memory or put secrets in `NEXT_PUBLIC_*`. Browser env is public.
8. Import `@/lib/mock/*` outside the allowed touchpoints (CONVENTIONS section 12).
9. Ship a behavior change without co-located specs for success, error, and unauthenticated paths.
10. Run without explicit user approval: `git push`, `npm publish`, or anything that changes CI or production config. Never edit an accepted ADR body.

Stop and ask when auth or session behavior, API contract meaning, or data integrity is unclear.

## Load only when

Skills are folders `.agents/skills/<name>/SKILL.md`. Open the file when its row applies, even if your tool does not discover skills itself.

| When you are | Load |
| --- | --- |
| Writing or fixing tests, or removing `as`/`any` from a spec | `.agents/skills/write-tests/SKILL.md` |
| Adding a feature, route, page, hook, API wrapper, or form | `.agents/skills/add-feature/SKILL.md` |
| Writing docs, ADRs, or ROADMAP entries | `.agents/skills/write-docs/SKILL.md` |
| Needing layout, clients, caching, Query, or SEO rules | `docs/ai/CONVENTIONS.md` |
| Reviewing against known bad patterns | `docs/ai/ANTI-PATTERNS.md` |
| Looking for where something lives | `docs/ai/CODE-MAP.md` |
| Calling or changing an API endpoint | `docs/API-INTEGRATION.md` |
| Touching tokens, cookies, headers, env vars, or auth flows | `SECURITY.md`, `docs/architecture/ARCHITECTURE.md` |
| Running or changing Playwright | `e2e/README.md` |

Never load `docs/ROADMAP.md` in full; `rg` for the phase. Other `docs/` files are human reference: open one only for its area.
