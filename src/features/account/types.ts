import type { components } from '@/lib/api/generated/schema';

export type UserDetailResponseDto =
  components['schemas']['UserDetailResponseDto'];
export type AddressResponseDto = components['schemas']['AddressResponseDto'];
export type AddAddressDto = components['schemas']['AddAddressDto'];
export type UpdateAddressDto = components['schemas']['UpdateAddressDto'];
export type AddressType = AddressResponseDto['type'];
