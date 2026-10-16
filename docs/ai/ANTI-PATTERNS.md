# Storefront Anti-Patterns and Review Checklist

Bad and good examples that enforce [CONVENTIONS.md](CONVENTIONS.md). Used when writing and reviewing code.

## 1. Import direction

Rule: CONVENTIONS section 2 (`lib/` never imports `features/`).

Bad:

```ts
// src/lib/auth/auth-context.tsx
import { clearStoredCartId } from '@/features/cart/lib/cart-storage';
```

Good: accept a callback in `lib/` and compose it in the app shell.

```tsx
// src/lib/auth/auth-context.tsx
type AuthProviderProps = {
  children: ReactNode;
  onClearLocalSideEffects?: () => void;
};

// src/app/providers.tsx
<AuthProvider onClearLocalSideEffects={clearStoredCartId}>{children}</AuthProvider>
```

## 2. Thin routes as slot composition

Rule: CONVENTIONS section 2 (routes compose features; catalog must not import cart UI).

Bad:

```tsx
// features/catalog/components/product-detail.tsx
import { AddToCartCta } from '@/features/cart/components/add-to-cart-cta';
```

Good: the route owns the slot.

```tsx
// app/(shop)/products/[id]/page.tsx
<ProductDetailShell product={product}>
  <AddToCartCta productId={product.id} />
</ProductDetailShell>
```

## 3. No English-message matching

Rule: CONVENTIONS section 9 (structured API `code` values).

Bad:

```ts
body.message?.includes('Password change required');
```

Good:

```ts
body.code === 'MUST_CHANGE_PASSWORD';
```

## 4. No invented contract fields

Rule: CONVENTIONS section 8 (render only what the API returns).

Bad:

```tsx
<p>Free shipping, confirmation email on the way</p>
```

Good:

```tsx
{order.shippingCost != null ? (
  <Money amount={order.shippingCost} currency={order.currency} />
) : null}
```

## 5. One client per side, no BFF

Rule: CONVENTIONS section 3 (one client per side, no BFF).

Bad:

```ts
export const client = typeof window === 'undefined' ? serverFetch : browserFetch;
```

Good:

```ts
// Server Component
import { serverClient } from '@/lib/api/server-client';

// Client Component
import { browserClient } from '@/lib/api/browser-client';
```

## 6. Catalog is not client state

Rule: CONVENTIONS section 4 (catalog is RSC).

Bad:

```tsx
'use client';
const searchParams = useSearchParams();
const { data } = useQuery({ queryKey: ['products', searchParams.toString()], queryFn: ... });
```

Good:

```tsx
// app/(shop)/products/page.tsx (Server Component)
const query = parseCatalogSearchParams(await searchParams);
const products = await getProducts(query);
```

## 7. Empty cart is not an error

Rule: CONVENTIONS section 9 (cart `404` is an empty cart).

Bad:

```ts
if (response.status === 404) throw toApiRequestError(response, 'Cart missing');
```

Good:

```ts
if (response.status === 404) return null;
```

## 8. Casts and `any`

Rule: AGENTS.md rule 1. Replacements for the common casts (JSON bodies, `readonly string[]` guards, `request` and `target` narrowing, hoisted mock state) are in the `write-tests` skill; the same patterns apply to source code. Next's documented `as Route` is the one exception (CONVENTIONS section 6).

## 9. Testing anti-patterns

Rule: `write-tests` skill (hook-mocked specs render without `QueryClientProvider`; no conditional `expect`).

Bad:

```tsx
render(
  <QueryClientProvider client={client}>
    <CheckoutForm />
  </QueryClientProvider>,
);

if (result.success) {
  expect(result.data.email).toBe('ada@example.com');
}
```

Good:

```tsx
vi.mocked(useCart).mockReturnValue(createMockUseCartResult());
render(<CheckoutForm />);

expect(schema.safeParse(input)).toMatchObject({ success: true, data: { email: 'ada@example.com' } });
```

## Review checklist

- [ ] No `lib/` to `features/` imports (ESLint `no-restricted-imports`)
- [ ] Routes compose feature slots; catalog does not import cart UI
- [ ] Catalog stays RSC; no catalog data in TanStack Query
- [ ] One client per side; no BFF; no ad-hoc `fetch` for domain calls
- [ ] Auth branches use API `code` values, not English substrings
- [ ] UI does not invent shipping, email, or totals the API does not return
- [ ] Cart `404` is empty, not an error banner
- [ ] After cart or checkout mutations: Query invalidation and `router.refresh()`
- [ ] Typed factories in tests; no conditional `expect`; no new `as`/`any`
- [ ] Docs and comments use ASCII punctuation (no em dashes or curly quotes)
