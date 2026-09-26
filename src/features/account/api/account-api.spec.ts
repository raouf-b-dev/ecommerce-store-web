// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addAddressRequest,
  deleteAddressRequest,
  getMeRequest,
  setDefaultAddressRequest,
  updateAddressRequest,
} from './account-api';
import {
  createMockAddress,
  createMockUserDetail,
} from '@/test/fixtures/account.fixture';
import {
  createErrorApiResponse,
  createSuccessApiResponse,
} from '@/test/fixtures/api-response.fixture';
import type { AddAddressDto, UpdateAddressDto } from '@/features/account/types';

const mockClient = vi.hoisted(() => ({
  GET: vi.fn(),
  POST: vi.fn(),
  PATCH: vi.fn(),
  DELETE: vi.fn(),
}));

vi.mock('@/lib/api/browser-client', () => ({
  browserClient: mockClient,
}));

function createVoidSuccessResponse(status = 204) {
  return {
    data: undefined,
    error: undefined,
    response: new Response(null, { status }),
  };
}

describe('account-api', () => {
  const addDto: AddAddressDto = {
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    type: 'HOME',
    isDefault: true,
  };

  const updateDto: UpdateAddressDto = {
    street: '456 Oak Avenue',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94102',
    country: 'US',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMeRequest', () => {
    it('calls GET /v1/users/me and returns user detail', async () => {
      const user = createMockUserDetail();
      mockClient.GET.mockResolvedValueOnce(createSuccessApiResponse(user));

      const result = await getMeRequest();

      expect(mockClient.GET).toHaveBeenCalledWith('/v1/users/me');
      expect(result).toEqual(user);
    });

    it('throws on error response', async () => {
      mockClient.GET.mockResolvedValueOnce(
        createErrorApiResponse({ message: 'Not found' }, 404),
      );

      await expect(getMeRequest()).rejects.toThrow();
    });
  });

  describe('addAddressRequest', () => {
    it('calls POST /v1/users/{id}/addresses with body', async () => {
      mockClient.POST.mockResolvedValueOnce(createVoidSuccessResponse());

      await addAddressRequest(1, addDto);

      expect(mockClient.POST).toHaveBeenCalledWith('/v1/users/{id}/addresses', {
        params: { path: { id: 1 } },
        body: addDto,
      });
    });

    it('throws when response is not ok', async () => {
      mockClient.POST.mockResolvedValueOnce(
        createErrorApiResponse({ message: 'Validation failed' }, 400),
      );

      await expect(addAddressRequest(1, addDto)).rejects.toThrow();
    });
  });

  describe('updateAddressRequest', () => {
    it('calls PATCH /v1/users/{id}/addresses/{addressId}', async () => {
      mockClient.PATCH.mockResolvedValueOnce(createVoidSuccessResponse());

      await updateAddressRequest(1, 10, updateDto);

      expect(mockClient.PATCH).toHaveBeenCalledWith(
        '/v1/users/{id}/addresses/{addressId}',
        {
          params: { path: { id: 1, addressId: 10 } },
          body: updateDto,
        },
      );
    });

    it('throws when response is not ok', async () => {
      mockClient.PATCH.mockResolvedValueOnce(
        createErrorApiResponse({ message: 'Not found' }, 404),
      );

      await expect(updateAddressRequest(1, 10, updateDto)).rejects.toThrow();
    });
  });

  describe('deleteAddressRequest', () => {
    it('calls DELETE /v1/users/{id}/addresses/{addressId}', async () => {
      mockClient.DELETE.mockResolvedValueOnce(createVoidSuccessResponse());

      await deleteAddressRequest(1, createMockAddress().id);

      expect(mockClient.DELETE).toHaveBeenCalledWith(
        '/v1/users/{id}/addresses/{addressId}',
        {
          params: { path: { id: 1, addressId: 1 } },
        },
      );
    });

    it('throws when response is not ok', async () => {
      mockClient.DELETE.mockResolvedValueOnce(
        createErrorApiResponse({ message: 'Forbidden' }, 403),
      );

      await expect(deleteAddressRequest(1, 1)).rejects.toThrow();
    });
  });

  describe('setDefaultAddressRequest', () => {
    it('calls PATCH set-default endpoint', async () => {
      mockClient.PATCH.mockResolvedValueOnce(createVoidSuccessResponse());

      await setDefaultAddressRequest(1, 2);

      expect(mockClient.PATCH).toHaveBeenCalledWith(
        '/v1/users/{id}/addresses/{addressId}/set-default',
        {
          params: { path: { id: 1, addressId: 2 } },
        },
      );
    });

    it('throws when response is not ok', async () => {
      mockClient.PATCH.mockResolvedValueOnce(
        createErrorApiResponse({ message: 'Failed' }, 500),
      );

      await expect(setDefaultAddressRequest(1, 2)).rejects.toThrow();
    });
  });
});
