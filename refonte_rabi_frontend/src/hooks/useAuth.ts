'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, AuthUser } from '@/types/api';

const SESSION_QUERY_KEY = ['auth', 'session'];

async function fetchSession(): Promise<AuthUser | null> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
    return data.success ? data.data.user : null;
  } catch {
    // 401 = pas de session active, ce n'est pas une erreur applicative
    return null;
  }
}

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await apiClient.post<ApiResponse<{ user: AuthUser }>>('/auth/login', input);
      if (!data.success) throw new Error(data.message);
      return data.data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email: string; password: string }) => {
      const { data } = await apiClient.post<ApiResponse<{ user: AuthUser }>>(
        '/auth/register',
        input,
      );
      if (!data.success) throw new Error(data.message);
      return data.data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, user);
    },
  });
}

export function useRegisterAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      fullName: string;
      email: string;
      password: string;
      about: string;
      genreIds: number[];
    }) => {
      const { data } = await apiClient.post<ApiResponse<{ user: AuthUser }>>(
        '/auth/register-author',
        input,
      );
      if (!data.success) throw new Error(data.message);
      return data.data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
    },
  });
}
