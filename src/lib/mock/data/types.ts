import type { components } from '@/lib/api/generated/schema';

export type CategoryResponseDto = components['schemas']['CategoryResponseDto'];
export type ProductDetailResponseDto =
  components['schemas']['ProductDetailResponseDto'];
export type ProductListItemResponseDto =
  components['schemas']['ProductListItemResponseDto'];

export type CartResponseDto = components['schemas']['CartResponseDto'];
export type CartItemResponseDto = components['schemas']['CartItemResponseDto'];
export type AddCartItemDto = components['schemas']['AddCartItemDto'];
export type UpdateCartItemDto = components['schemas']['UpdateCartItemDto'];

export type SeedInventoryRow = {
  productId: number;
  availableQuantity: number;
};

/** Cart line shape matches OpenAPI CartItemResponseDto. */
export type MockCartItem = CartItemResponseDto;
