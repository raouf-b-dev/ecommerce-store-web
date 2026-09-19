import type { components } from '@/lib/api/generated/schema';

export type CategoryResponseDto = components['schemas']['CategoryResponseDto'];
export type ProductDetailResponseDto =
  components['schemas']['ProductDetailResponseDto'];
export type ProductListItemResponseDto =
  components['schemas']['ProductListItemResponseDto'];

export type SeedInventoryRow = {
  productId: number;
  availableQuantity: number;
};
