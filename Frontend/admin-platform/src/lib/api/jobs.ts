import { serviceClients } from './client';

// Jobs admin API — talks to jobs-service (:3002) with the admin token (attached by the
// serviceClients interceptor). Powers the centralized Jobs/Talent admin section.
const client = serviceClients.jobs;

export interface JobRow {
  id: string;
  title: string;
  description?: string;
  location?: string;
  status?: string;
  employment_type?: string;
  country_id?: string;
  department_id?: string;
  org_id?: string;
  created_at?: string;
  [k: string]: unknown;
}

interface Paginated<T> {
  success: boolean;
  data: { items: T[]; pagination?: { total: number; page: number; limit: number; totalPages: number } };
}

export const jobsApi = {
  jobs: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
      client.get<Paginated<JobRow>>('/jobs', { params }),
    get: (id: string) => client.get(`/jobs/${id}`),
  },
  candidates: {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      client.get('/candidates', { params }),
  },
  applications: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      client.get('/applications', { params }),
  },
  analytics: {
    hiring: () => client.get('/analytics/hiring'),
  },
};
