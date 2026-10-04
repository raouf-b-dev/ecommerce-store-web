---
name: write-tests
description: Write or fix Vitest and Testing Library specs with typed mocks and no casts. Use when adding or editing a *.spec.ts or *.spec.tsx, covering a helper, schema, API wrapper, server fetcher, hook, component, or route guard, or removing `as`/`any` from an existing spec.
---

# Write tests

Copy the closest golden spec in [references/golden-specs.md](references/golden-specs.md), then adapt it.

## Rules

1. Put `<name>.spec.ts(x)` beside the file it covers. Import `describe`, `it`, `expect`, `vi`, `beforeEach` from `vitest`. One `describe` per unit, `it('<result> when <condition>')`.
2. Cover the success path, each error branch, and the unauthenticated or forbidden state when the code has one.
3. Test user-visible behavior and contract wiring. Query by role and label (`getByRole`, `getByLabelText`); use `userEvent` for new specs.
4. Never wrap `expect` in `if`, `try`, or a loop over results: the test passes when the branch is skipped. Assert the whole shape with `toMatchObject`, `rejects.toMatchObject`, `expect.arrayContaining`, or split the cases with `it.each`. To narrow a value for later code, use a guard that throws, not an `if` around assertions.
5. Build data with the typed factories in `src/test/fixtures/` (`createMockCart`, `createMockProductDetail`, `createSuccessApiResponse`, ...); add one when a DTO has none. No large inline literals repeated across tests.
6. Do not render Server Components. Test the RSC data layer (`features/*/api/get-*.ts`) and pure helpers as plain functions; Playwright covers RSC routes.
7. Component specs that mock hooks render without `QueryClientProvider`. Hook and `*-api` specs use a real `QueryClient` and mock the API module.
8. Reset state: `mockReset()` or `vi.clearAllMocks()` in `beforeEach`, or return fresh stubs from a `setup()` function.

## Typed mocks, in order of preference

1. **Callback props**: `vi.fn<() => Promise<void>>()` typed with the prop's signature. No module mock needed.
2. **A module you replace entirely** (a feature `*-api` module for a hook spec): `vi.mock('<path>')` with no factory, then `vi.mocked(fn).mockResolvedValue(...)`. `vi.mocked` infers the real signature, so values are checked (golden 5).
3. **A module you replace with a factory** (hooks, `useAuth`, `next/navigation`): create the stub with `vi.hoisted(() => vi.fn<typeof useX>())` and return it from the factory. For a partial shape use `vi.fn<() => Pick<ReturnType<typeof useX>, 'status' | ...>>()`. Import the hook with `import type`. When the hook's shape changes, the stub stops compiling (golden 6, 7).
4. **Partial data**: `{ ... } satisfies PaginatedOrdersResponseDto`. It checks fields without widening or asserting.
5. **A method on an object you own**: `vi.spyOn(obj, 'method')`.
6. **The generated clients**: `vi.hoisted(() => ({ GET: vi.fn() }))` for `browserClient` or `serverClient`, resolving the `{ data, error, response }` triple with `createSuccessApiResponse` or `createErrorApiResponse` (golden 3, 4). This untyped stub is allowed only for the generated clients, whose overloaded signatures cannot be written as one function type; the typed fixtures keep the data checked.

Forbidden: AGENTS.md rule 1 (`as`, `as unknown as`, `any`, `@ts-ignore`). A test that must pass invalid input uses `// @ts-expect-error <reason>`. If a third-party type cannot be built, stop and ask: do not cast.

### Replacing existing casts in specs

Fix them when you touch the file, then run `npm run lint:prune`.

- `(await response.json()) as { accessToken?: string }`: `z.object({ accessToken: z.string().optional() }).parse(await response.json())`.
- `fetchMock.mock.calls[0]?.[0] as Request`: `const [input] = fetchMock.mock.calls[0] ?? []; if (!(input instanceof Request)) throw new Error('expected a Request');`
- `sessionError: null as unknown` inside `vi.hoisted`: annotate the object instead, `const auth: Pick<ReturnType<typeof useAuth>, 'status' | 'sessionError'> = { status: 'loading', sessionError: null };` (see golden 7 for the stub style).
- `(ORDER_STATUS_VALUES as readonly string[]).includes(value)` in a guard: `ORDER_STATUS_VALUES.some((status) => status === value)`.
- `(event.target as HTMLElement).closest(...)`: `event.target instanceof HTMLElement && event.target.closest(...)`.

## By layer

- **Helper or schema**: pure input/output (golden 1, 2). `it.each` for tables of cases.
- **Browser API wrapper**: mock `@/lib/api/browser-client`; assert the call arguments, the returned DTO, `null` for an empty cart, and the thrown `ApiRequestError` status (golden 3).
- **Server fetcher**: mock `@/lib/api/server-client`; assert the DTO, `null` for a missing resource, and the upstream status (golden 4).
- **Hook**: real `QueryClient`, mocked API module, mocked `next/navigation`; assert the cache and `router.refresh()` effects (golden 5). Mutations invalidate the feature key factory and call `router.refresh()`.
- **Component**: mock the feature hook with the typed stub (golden 6). Assert loading, empty, error-with-retry, and data states.
- **Route guard**: typed `useAuth` and `next/navigation` stubs (golden 7).
- **Mock handlers (MSW)**: `src/lib/mock/handlers/handlers.spec.ts` shows the contract-test style; run `npx vitest run src/lib/mock`.
- **End to end**: Playwright in `e2e/` against a seeded API; see `e2e/README.md`. Add a spec only when an RSC route or the shopper journey changes.

## Run

`npx vitest run <path>` while iterating, then `npm run verify`. After removing a baselined cast, run `npm run lint:prune` (AGENTS.md rule 1).
