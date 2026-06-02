import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api/jobs';

export const jobsKeys = {
  all: ['jobs'] as const,
  list: (p?: Record<string, unknown>) => ['jobs', 'list', p] as const,
  candidates: (p?: Record<string, unknown>) => ['jobs', 'candidates', p] as const,
  applications: (p?: Record<string, unknown>) => ['jobs', 'applications', p] as const,
};

export const useJobsList = (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
  useQuery({
    queryKey: jobsKeys.list(params),
    queryFn: () => jobsApi.jobs.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useCandidatesList = (params?: { page?: number; limit?: number; search?: string }) =>
  useQuery({
    queryKey: jobsKeys.candidates(params),
    queryFn: () => jobsApi.candidates.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

export const useApplicationsList = (params?: { page?: number; limit?: number; status?: string }) =>
  useQuery({
    queryKey: jobsKeys.applications(params),
    queryFn: () => jobsApi.applications.list(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
