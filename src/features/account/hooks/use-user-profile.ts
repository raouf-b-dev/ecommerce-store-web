'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { getMeRequest } from '@/features/account/api/account-api';
import { accountKeys } from '@/features/account/hooks/account-keys';
import type { UserDetailResponseDto } from '@/features/account/types';

export type UseUserProfileResult = {
  user: UserDetailResponseDto | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};

export function useUserProfile(): UseUserProfileResult {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: accountKeys.me(),
    queryFn: getMeRequest,
    enabled: isAuthenticated,
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: async () => query.refetch(),
  };
}
