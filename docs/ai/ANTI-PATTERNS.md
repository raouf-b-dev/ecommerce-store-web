# Storefront Anti-Patterns & Review Checklist

Document Type: Applied Guide & Review Checklist  
Audience: Frontend Engineers & AI Code Reviewers  
Status: Active

Concrete **Good ✅ vs. Bad ❌** examples that enforce [`CONVENTIONS.md`](./CONVENTIONS.md).

---

## 1. Import direction

### Rule: `src/lib/` must not import `src/features/`.

#### ❌ BAD

```ts
// src/lib/auth/auth-context.tsx
import { clearStoredCartId } from '@/features/cart/lib/cart-storage';
```

#### ✅ GOOD

```ts
// src/lib/auth/auth-context.tsx - accept a callback
type AuthProviderProps = {
  children: ReactNode;
  onClearLocalSideEffects?: () => void;
};

// src/app/providers.tsx - compose from the app shell
<AuthProvider onClearLocalSideEffects={clearStoredCartId}>
  {children}
</AuthProvider>
```

---

## 2. Thin routes as slot composition

### Rule: Routes compose features. Features do not import each other's presentational chrome. Catalog must not import cart.

#### ❌ BAD

```tsx
// features/catalog/components/product-detail.tsx
import { AddToCartCta } from '@/features/cart/components/add-to-cart-cta';

export function ProductDetail({ product }: Props) {
  return (
    <>
      <h1>{product.name}</h1>
      <AddToCartCta productId={product.id} />
    </>
  );
}
```

#### ✅ GOOD

```tsx
// app/(shop)/products/[id]/page.tsx - route owns the slot
<ProductDetailShell product={product}>
  <AddToCartCta productId={product.id} />
</ProductDetailShell>
```

---

## 3. No English-message auth matching

### Rule: Prefer structured `code` from the API. Patch the API if the contract is wrong.

#### ❌ BAD

```ts
body.message?.includes('Password change required');
```

#### ✅ GOOD

```ts
body.code === 'MUST_CHANGE_PASSWORD';
```

---

## 4. No invented contract fields

### Rule: Render only fields the API returns. Do not invent Free shipping or receipt email.

#### ❌ BAD

```tsx
<p>Free shipping · Confirmation email on the way</p>
```

#### ✅ GOOD

```tsx
{order.shippingCost != null ? (
  <Money amount={order.shippingCost} currency={order.currency} />
) : null}
```

---

## 5. No BFF / dual clients

### Rule: Prefer OpenAPI `browserClient` / `serverClient`. No Route Handlers that proxy the ecommerce API. No `typeof window` hybrid clients.

#### ❌ BAD

```ts
export const client =
  typeof window === 'undefined' ? serverFetch : browserFetch;
```

#### ✅ GOOD

```ts
// Server Component
import { serverClient } from '@/lib/api/server-client';

// Client Component
import { browserClient } from '@/lib/api/browser-client';
```

---

## 6. Empty cart is not an error

### Rule: `GET /v1/carts/current` **404** means no cart yet → treat as empty (`null`), not `QueryStateAlert`.

#### ❌ BAD

```ts
if (response.status === 404) throw toApiRequestError(response, 'Cart missing');
```

#### ✅ GOOD

```ts
if (response.status === 404) return null; // empty cart for useCart
```

---

## 7. Testing anti-patterns

### Rule: Component specs that mock hooks do not need `QueryClientProvider`. Hook/API specs do.

#### ❌ BAD

```tsx
// checkout-form.spec.tsx already mocks useCart / useCheckoutMutation
render(
  <QueryClientProvider client={client}>
    <CheckoutForm />
  </QueryClientProvider>,
);
```

#### ✅ GOOD

```tsx
vi.spyOn(cartHooks, 'useCart').mockReturnValue(emptyCartResult);
render(<CheckoutForm />);
```

---

## Review checklist

- [ ] No `lib/` → `features/` imports (ESLint `no-restricted-imports`)
- [ ] Routes compose feature slots; catalog does not import cart UI
- [ ] Auth redirects use `MUST_CHANGE_PASSWORD` code, not English substrings
- [ ] UI does not invent shipping / email / totals the API does not return
- [ ] OpenAPI client only; no BFF
- [ ] Cart 404 → empty, not error banner
- [ ] Typed factories in tests; no QueryClient around hook-mocked components
- [ ] Docs and comments use ASCII punctuation (no em dashes or curly quotes)

## 8. ASCII prose

### Rule: Docs and comments look typed, not generated. No smart punctuation.

#### BAD

Em dash (U+2014) between clauses. Curly quotes around `"Free shipping"`. Ellipsis character (U+2026) in comments.

#### GOOD

```md
Phase 10: Standalone MSW mock preview
400-499 client errors
Loading...
```

Enforced by ESLint `ascii-prose/no-smart-punctuation` on comments and `node scripts/lint-ascii-prose.cjs` on Markdown.
