import { browserClient } from '@/lib/api/browser-client';
import { throwApiErrorFromResponse } from '@/lib/api/throw-api-error';
import type {
  AddCartItemDto,
  CartResponse,
  UpdateCartItemDto,
} from '@/features/cart/types';

export async function createCartRequest(): Promise<CartResponse> {
  const { data, error, response } = await browserClient.POST('/v1/carts');

  if (error || !data || !response.ok) {
    await throwApiErrorFromResponse(response, 'Failed to create cart.');
  }

  return data;
}

export async function getCartRequest(id: number): Promise<CartResponse> {
  const { data, error, response } = await browserClient.GET('/v1/carts/{id}', {
    params: {
      path: { id },
    },
  });

  if (error || !data || !response.ok) {
    await throwApiErrorFromResponse(response, 'Failed to load cart.');
  }

  return data;
}

export async function addItemToCartRequest(
  cartId: number,
  dto: AddCartItemDto,
): Promise<void> {
  const { error, response } = await browserClient.POST('/v1/carts/{id}/items', {
    params: {
      path: { id: cartId },
    },
    body: dto,
  });

  if (error || !response.ok) {
    await throwApiErrorFromResponse(response, 'Failed to add item to cart.');
  }
}

export async function updateCartItemRequest(
  cartId: number,
  itemId: number,
  dto: UpdateCartItemDto,
): Promise<void> {
  const { error, response } = await browserClient.PATCH(
    '/v1/carts/{id}/items/{itemId}',
    {
      params: {
        path: { id: cartId, itemId },
      },
      body: dto,
    },
  );

  if (error || !response.ok) {
    await throwApiErrorFromResponse(
      response,
      'Failed to update cart item quantity.',
    );
  }
}

export async function removeCartItemRequest(
  cartId: number,
  itemId: number,
): Promise<void> {
  const { error, response } = await browserClient.DELETE(
    '/v1/carts/{id}/items/{itemId}',
    {
      params: {
        path: { id: cartId, itemId },
      },
    },
  );

  if (error || !response.ok) {
    await throwApiErrorFromResponse(
      response,
      'Failed to remove cart item.',
    );
  }
}

export async function clearCartRequest(cartId: number): Promise<void> {
  const { error, response } = await browserClient.DELETE('/v1/carts/{id}', {
    params: {
      path: { id: cartId },
    },
  });

  if (error || !response.ok) {
    await throwApiErrorFromResponse(response, 'Failed to clear cart.');
  }
}
