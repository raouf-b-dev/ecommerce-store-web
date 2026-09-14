import { browserClient } from '@/lib/api/browser-client';
import { throwApiErrorFromResponse } from '@/lib/api/throw-api-error';
import type {
  AddAddressDto,
  UpdateAddressDto,
  UserDetailResponseDto,
} from '@/features/account/types';

export async function getUserRequest(
  userId: number,
): Promise<UserDetailResponseDto> {
  const { data, error, response } = await browserClient.GET('/v1/users/{id}', {
    params: {
      path: { id: userId },
    },
  });

  if (error || !data || !response.ok) {
    return await throwApiErrorFromResponse(
      response,
      'Failed to load account profile.',
    );
  }

  return data;
}

export async function addAddressRequest(
  userId: number,
  dto: AddAddressDto,
): Promise<void> {
  const { error, response } = await browserClient.POST(
    '/v1/users/{id}/addresses',
    {
      params: {
        path: { id: userId },
      },
      body: dto,
    },
  );

  if (error || !response.ok) {
    await throwApiErrorFromResponse(response, 'Failed to add address.');
  }
}

export async function updateAddressRequest(
  userId: number,
  addressId: number,
  dto: UpdateAddressDto,
): Promise<void> {
  const { error, response } = await browserClient.PATCH(
    '/v1/users/{id}/addresses/{addressId}',
    {
      params: {
        path: { id: userId, addressId },
      },
      body: dto,
    },
  );

  if (error || !response.ok) {
    await throwApiErrorFromResponse(response, 'Failed to update address.');
  }
}

export async function deleteAddressRequest(
  userId: number,
  addressId: number,
): Promise<void> {
  const { error, response } = await browserClient.DELETE(
    '/v1/users/{id}/addresses/{addressId}',
    {
      params: {
        path: { id: userId, addressId },
      },
    },
  );

  if (error || !response.ok) {
    await throwApiErrorFromResponse(response, 'Failed to delete address.');
  }
}

export async function setDefaultAddressRequest(
  userId: number,
  addressId: number,
): Promise<void> {
  const { error, response } = await browserClient.PATCH(
    '/v1/users/{id}/addresses/{addressId}/set-default',
    {
      params: {
        path: { id: userId, addressId },
      },
    },
  );

  if (error || !response.ok) {
    await throwApiErrorFromResponse(
      response,
      'Failed to set default address.',
    );
  }
}
