import { apiClient } from "@/lib/apiClient";
import { AppError } from "@/lib/errors/errors";
import { Country } from "@/lib/talent-acquisition";

export const talentServerService = {
  async getCountries(filters: { isActive?: boolean } = {}) {
    const q = filters.isActive !== undefined ? `?isActive=${filters.isActive}` : '';
    const response = await apiClient.get<Country[]>(`/countries${q}`);
    if (!response.success || !response.data) throw new AppError('Failed to fetch countries', 500);
    return response.data;
  },

  async getCountryBySlug(slug: string) {
    const response = await apiClient.get<Country>(`/countries/${slug}`);
    if (!response.success) {
      if ((response.error ?? '').toLowerCase().includes('not found')) return undefined;
      throw new AppError(response.error || 'Failed to fetch country', 500);
    }
    return response.data || undefined;
  },

  async getCountryById(id: string) {
    const countries = await this.getCountries();
    return (countries as any[]).find((c: any) => c.id === id);
  },

  async getDepartments(filters: { isActive?: boolean; countryId?: string } = {}) {
    const q = new URLSearchParams();
    if (filters.isActive !== undefined) q.set('isActive', String(filters.isActive));
    if (filters.countryId) q.set('countryId', filters.countryId);
    const qs = q.toString();
    const response = await apiClient.get(`/departments${qs ? `?${qs}` : ''}`);
    if (!response.success || !response.data) throw new AppError(response.error || 'Failed to fetch departments', 500);
    return response.data;
  },

  async getJobs(filters: { status?: string; visibility?: string; countryId?: string; employmentType?: any } = {}) {
    const q = new URLSearchParams();
    if (filters.status) q.set('status', filters.status);
    if (filters.visibility) q.set('visibility', filters.visibility);
    if (filters.countryId) q.set('countryId', filters.countryId);
    const qs = q.toString();
    const response = await apiClient.get(`/jobs${qs ? `?${qs}` : ''}`);
    if (!response.success || !response.data) throw new AppError(response.error || 'Failed to fetch jobs', 500);
    return response.data;
  },

  async getJobById(id: string) {
    const response = await apiClient.get(`/jobs/${id}`);
    if (!response.success) {
      if ((response.error ?? '').toLowerCase().includes('not found')) return undefined;
      throw new AppError(response.error || 'Failed to fetch job', 500);
    }
    return response.data || undefined;
  },

  async getComplianceProfile(id: string) {
    const response = await apiClient.get(`/compliance-profiles/${id}`);
    if (!response.success) {
      if ((response.error ?? '').toLowerCase().includes('not found')) return undefined;
      throw new AppError(response.error || 'Failed to fetch compliance profile', 500);
    }
    return response.data || undefined;
  },

  async getRolesByCountry(slug: string) {
    const response = await apiClient.get(`/roles/${slug}`);
    if (!response.success || !response.data) throw new AppError(response.error || 'Failed to fetch roles', 500);
    return response.data;
  },
};
