import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersApi } from '@/lib/api/users';
import type { PaginationParams } from '@/lib/types/common.types';
import type { UpdateUserPayload } from '@/lib/types/user.types';

export const userKeys = {
  all: ['users'] as const,
  list: (params?: PaginationParams) => [...userKeys.all, 'list', params] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
};

export const useUsers = (params?: PaginationParams & { status?: string; role?: string }) =>
  useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useUser = (id: number) =>
  useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.get(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      usersApi.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success('User updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useSuspendUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      usersApi.suspend(id, { reason }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success('User suspended');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUnsuspendUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersApi.unsuspend(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast.success('User unsuspended');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
