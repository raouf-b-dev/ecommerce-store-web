# Golden specs

Each block compiles, lints, and passes in this repo. Copy the closest one, rename, adapt. The first line is the file location; do not copy it. Specs sit beside the code. Import `describe`, `it`, `expect`, `vi`, and `beforeEach` from `vitest` explicitly: the globals are not typed in this repo's `tsconfig`, so `npm run typecheck` fails without the import.

Fixtures: `src/test/fixtures/` has typed factories (`createMockCart`, `createMockUseCartResult`, `createMockProductDetail`, ...) and API response builders (`createSuccessApiResponse`, `createErrorApiResponse`). Use them; add to them when a DTO has none.

## 1. Pure helper

```ts
// src/features/catalog/lib/<name>.spec.ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  parseCatalogSearchParams,
} from '@/features/catalog/lib/catalog-params';

describe('parseCatalogSearchParams', () => {
  it('returns defaults for an empty query', () => {
    expect(parseCatalogSearchParams({})).toMatchObject({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it.each([
    [{ page: '3' }, { page: 3 }],
    [{ limit: '1000' }, { limit: MAX_LIMIT }],
    [{ search: '  keyboard  ' }, { search: 'keyboard' }],
    [{ sortBy: 'price', sortOrder: 'asc' }, { sortBy: 'price', sortOrder: 'asc' }],
    [{ page: ['2', '9'] }, { page: 2 }],
  ])('parses %j', (raw, expected) => {
    expect(parseCatalogSearchParams(raw)).toMatchObject(expected);
  });

  it('drops an inverted price range and unknown sort values', () => {
    expect(
      parseCatalogSearchParams({
        minPrice: '50',
        maxPrice: '10',
        sortBy: 'nope',
        sortOrder: 'sideways',
      }),
    ).toMatchObject({
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });
});
```

## 2. Zod schema

`safeParse` returns a union. Assert the whole shape with `toMatchObject`; never branch on `result.success`.

```ts
// src/features/auth/schemas/<name>.spec.ts
import { describe, expect, it } from 'vitest';
import { loginSchema } from '@/features/auth/schemas/login-schema';

describe('loginSchema', () => {
  it('accepts an email and a password', () => {
    expect(
      loginSchema.safeParse({ email: 'ada@example.com', password: 'secret-123' }),
    ).toMatchObject({ success: true, data: { email: 'ada@example.com' } });
  });

  it('rejects a malformed email and reports the field', () => {
    expect(
      loginSchema.safeParse({ email: 'not-an-email', password: 'secret-123' }),
    ).toMatchObject({
      success: false,
      error: {
        issues: expect.arrayContaining([
          expect.objectContaining({ path: ['email'] }),
        ]),
      },
    });
  });
});
```

## 3. Browser API wrapper (mock the generated client)

Mock `@/lib/api/browser-client`, answer with the fixture builders, and assert the wrapper's contract: the returned DTO, `null` for a 404 empty cart, or the thrown `ApiRequestError`.

```ts
// src/features/cart/api/<name>.spec.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentCartRequest } from '@/features/cart/api/cart-api';
import {
  createErrorApiResponse,
  createSuccessApiResponse,
} from '@/test/fixtures/api-response.fixture';
import { createMockCart } from '@/test/fixtures/cart.fixture';

// Untyped on purpose: only for the generated clients (see SKILL.md, typed mocks, item 6).
const client = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock('@/lib/api/browser-client', () => ({ browserClient: client }));

describe('getCurrentCartRequest', () => {
  beforeEach(() => {
    client.GET.mockReset();
  });

  it('returns the cart on 200', async () => {
    const cart = createMockCart();
    client.GET.mockResolvedValue(createSuccessApiResponse(cart));

    await expect(getCurrentCartRequest()).resolves.toEqual(cart);
    expect(client.GET).toHaveBeenCalledWith('/v1/carts/current');
  });

  it('treats 404 as an empty cart, not an error', async () => {
    client.GET.mockResolvedValue(
      createErrorApiResponse({ statusCode: 404, message: 'No cart' }, 404),
    );

    await expect(getCurrentCartRequest()).resolves.toBeNull();
  });

  it('throws an ApiRequestError with the API status on 500', async () => {
    client.GET.mockResolvedValue(
      createErrorApiResponse({ statusCode: 500, message: 'Server down' }, 500),
    );

    await expect(getCurrentCartRequest()).rejects.toMatchObject({
      name: 'ApiRequestError',
      statusCode: 500,
    });
  });
});
```

## 4. Server fetcher (RSC data layer)

Server fetchers `import 'server-only'` (stubbed in `src/test/setup.ts`) and use the server client. Test them as plain async functions; do not render Server Components.

```ts
// src/features/catalog/api/<name>.spec.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProduct } from '@/features/catalog/api/get-product';
import {
  createErrorApiResponse,
  createSuccessApiResponse,
} from '@/test/fixtures/api-response.fixture';
import { createMockProductDetail } from '@/test/fixtures/catalog.fixture';

// Untyped on purpose: only for the generated clients (see SKILL.md, typed mocks, item 6).
const server = vi.hoisted(() => ({ GET: vi.fn() }));

vi.mock('@/lib/api/server-client', () => ({ serverClient: server }));

describe('getProduct', () => {
  beforeEach(() => {
    server.GET.mockReset();
  });

  it('returns an active product', async () => {
    const product = createMockProductDetail({ id: 7, isActive: true });
    server.GET.mockResolvedValue(createSuccessApiResponse(product));

    await expect(getProduct(7)).resolves.toEqual(product);
  });

  it('returns null for a missing product so the page can call notFound()', async () => {
    server.GET.mockResolvedValue(
      createErrorApiResponse({ statusCode: 404, message: 'Not found' }, 404),
    );

    await expect(getProduct(8)).resolves.toBeNull();
  });

  it('keeps the HTTP status of an upstream failure', async () => {
    server.GET.mockResolvedValue(
      createErrorApiResponse({ statusCode: 429, message: 'Slow down' }, 429),
    );

    await expect(getProduct(9)).rejects.toMatchObject({ statusCode: 429 });
  });
});
```

## 5. Mutation hook (real QueryClient, mocked API module)

Automock the API module, then `vi.mocked(fn)` keeps the real signature. Type the other stubs from the real modules. Assert cache and router effects.

```tsx
// src/features/cart/hooks/<name>.spec.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { useRouter } from 'next/navigation';
import { clearCartRequest } from '@/features/cart/api/cart-api';
import { cartKeys } from '@/features/cart/hooks/cart-keys';
import { useClearCart } from '@/features/cart/hooks/use-cart-mutations';
import type { useAuth } from '@/lib/auth/auth-context';
import { createMockCart } from '@/test/fixtures/cart.fixture';

vi.mock('@/features/cart/api/cart-api');

const refresh = vi.hoisted(() => vi.fn<ReturnType<typeof useRouter>['refresh']>());

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

type AuthStub = Pick<ReturnType<typeof useAuth>, 'session'>;
const auth = vi.hoisted(() => vi.fn<() => AuthStub>());

vi.mock('@/lib/auth/auth-context', () => ({ useAuth: auth }));

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(cartKeys.current(null), createMockCart({ id: 55 }));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('useClearCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockReturnValue({ session: null });
  });

  it('clears the cached cart and refreshes server components after success', async () => {
    vi.mocked(clearCartRequest).mockResolvedValue(undefined);
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useClearCart(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(clearCartRequest).toHaveBeenCalledWith(55);
    expect(queryClient.getQueryData(cartKeys.current(null))).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not refresh when the API call fails', async () => {
    vi.mocked(clearCartRequest).mockRejectedValue(new Error('boom'));
    const { wrapper } = setup();
    const { result } = renderHook(() => useClearCart(), { wrapper });

    await act(async () => {
      // mutateAsync rejects; swallow it here so the assertion below can run.
      await result.current.mutateAsync().catch(() => undefined);
    });

    expect(refresh).not.toHaveBeenCalled();
  });
});
```

## 6. Client component with a mocked hook

Type the hook stub with the hook itself (`vi.fn<typeof useCart>()`), and build its return value with the fixture, so the stub breaks when the hook's shape changes. No `QueryClientProvider`.

```tsx
// src/features/cart/components/<name>.spec.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartContent } from '@/features/cart/components/cart-content';
import type { useCart, UseCartResult } from '@/features/cart/hooks/use-cart';
import {
  createMockCart,
  createMockCartItem,
  createMockUseCartResult,
} from '@/test/fixtures/cart.fixture';
import { ApiRequestError } from '@/lib/api/parse-api-error';

const cartQuery = vi.hoisted(() => vi.fn<typeof useCart>());

vi.mock('@/features/cart/hooks/use-cart', () => ({ useCart: cartQuery }));

vi.mock('@/features/cart/hooks/use-cart-mutations', () => ({
  useUpdateCartItemQuantity: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveCartItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useClearCart: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('CartContent', () => {
  it('shows the empty state when there is no cart', () => {
    cartQuery.mockReturnValue(
      createMockUseCartResult({ cart: null, cartId: null, items: [] }),
    );

    render(<CartContent />);

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('lists the items with the order summary', () => {
    const item = createMockCartItem({ productName: 'Wireless Headphones' });
    cartQuery.mockReturnValue(
      createMockUseCartResult({
        cart: createMockCart({ items: [item] }),
        items: [item],
      }),
    );

    render(<CartContent />);

    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();
  });

  it('shows the API error and retries on click', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn<UseCartResult['refetch']>();
    cartQuery.mockReturnValue(
      createMockUseCartResult({
        cart: null,
        cartId: null,
        items: [],
        isError: true,
        error: new ApiRequestError({ statusCode: 500, message: 'Server down' }),
        refetch,
      }),
    );

    render(<CartContent />);

    expect(screen.getByText('Could not load shopping cart')).toBeInTheDocument();
    expect(screen.getByText('Server down')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
```

## 7. Client route guard (mocked router and auth)

Derive the stub types from the real hooks (`Pick<ReturnType<typeof useAuth>, ...>`), use `import type` for them, and give every state its own `it`.

```tsx
// src/lib/auth/<name>.spec.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { useRouter } from 'next/navigation';
import type { useAuth } from '@/lib/auth/auth-context';
import { ProtectedRoute } from '@/lib/auth/protected-route';

type AuthStub = Pick<
  ReturnType<typeof useAuth>,
  'status' | 'mustChangePassword' | 'sessionError' | 'retrySession'
>;

const auth = vi.hoisted(() => vi.fn<() => AuthStub>());
const replace = vi.hoisted(() => vi.fn<ReturnType<typeof useRouter>['replace']>());
const retrySession = vi.hoisted(() => vi.fn<AuthStub['retrySession']>());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/account',
  useSearchParams: () => new URLSearchParams('tab=orders'),
}));
vi.mock('@/lib/auth/auth-context', () => ({ useAuth: auth }));

function authState(overrides: Partial<AuthStub>): AuthStub {
  return {
    status: 'authenticated',
    mustChangePassword: false,
    sessionError: null,
    retrySession,
    ...overrides,
  };
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the children for an authenticated shopper', () => {
    auth.mockReturnValue(authState({}));

    render(<ProtectedRoute>Private account</ProtectedRoute>);

    expect(screen.getByText('Private account')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects an unauthenticated shopper to login and keeps the destination', () => {
    auth.mockReturnValue(authState({ status: 'unauthenticated' }));

    render(<ProtectedRoute>Private account</ProtectedRoute>);

    expect(screen.queryByText('Private account')).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith('/login?redirect=%2Faccount%3Ftab%3Dorders');
  });

  it('offers a retry instead of redirecting when the API is down', async () => {
    const user = userEvent.setup();
    auth.mockReturnValue(
      authState({ status: 'error', sessionError: new Error('API unavailable') }),
    );

    render(<ProtectedRoute>Private account</ProtectedRoute>);
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(retrySession).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });
});
```
