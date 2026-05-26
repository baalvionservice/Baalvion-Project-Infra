import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { websitesApi } from '@/lib/api/cms-websites';
import { useCmsStore } from '@/lib/store/cmsStore';
import type {
  CreateWebsitePayload,
  UpdateWebsitePayload,
  AddWebsiteMemberPayload,
} from '@/lib/types/cms-website.types';

export const websiteKeys = {
  all: ['cms', 'websites'] as const,
  list: (params?: Record<string, unknown>) => [...websiteKeys.all, 'list', params] as const,
  detail: (id: string) => [...websiteKeys.all, 'detail', id] as const,
  stats: (id: string) => [...websiteKeys.all, 'stats', id] as const,
  members: (id: string) => [...websiteKeys.all, 'members', id] as const,
};

export const useWebsites = (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
  useQuery({
    queryKey: websiteKeys.list(params),
    queryFn: () => websitesApi.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useWebsite = (id: string) =>
  useQuery({
    queryKey: websiteKeys.detail(id),
    queryFn: () => websitesApi.get(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useWebsiteStats = (id: string) =>
  useQuery({
    queryKey: websiteKeys.stats(id),
    queryFn: () => websitesApi.stats(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 2 * 60_000,
  });

export const useWebsiteMembers = (websiteId: string) =>
  useQuery({
    queryKey: websiteKeys.members(websiteId),
    queryFn: () => websitesApi.members.list(websiteId).then((r) => r.data.data),
    enabled: !!websiteId,
  });

export const useCreateWebsite = () => {
  const qc = useQueryClient();
  const setActiveWebsite = useCmsStore((s) => s.setActiveWebsite);
  return useMutation({
    mutationFn: (payload: CreateWebsitePayload) => websitesApi.create(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: websiteKeys.all });
      setActiveWebsite(res.data.data);
      toast.success('Website created');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUpdateWebsite = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateWebsitePayload) => websitesApi.update(id, payload),
    onSuccess: (res) => {
      qc.setQueryData(websiteKeys.detail(id), res.data.data);
      qc.invalidateQueries({ queryKey: websiteKeys.all });
      toast.success('Website updated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useDeleteWebsite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => websitesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: websiteKeys.all });
      toast.success('Website deleted');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useAddWebsiteMember = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddWebsiteMemberPayload) =>
      websitesApi.members.add(websiteId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: websiteKeys.members(websiteId) });
      toast.success('Member added');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useRemoveWebsiteMember = (websiteId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => websitesApi.members.remove(websiteId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: websiteKeys.members(websiteId) });
      toast.success('Member removed');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};
