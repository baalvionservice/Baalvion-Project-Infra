import { apiClient } from "@/lib/apiClient";
import { AppError } from "@/lib/errors/errors";
import { Country } from "@/lib/talent-acquisition";

export const talentServerService = {
  /**
   * Every country by default — jobs can be posted, and applications received, from
   * anywhere. Pass `hub: true` for the nine countries that have editorial pages; that
   * is the right list for marketing surfaces and the sitemap, and the wrong one for any
   * filter or form, which must not stop a recruiter hiring somewhere new.
   */
  async getCountries(filters: { isActive?: boolean; hub?: boolean } = {}) {
    const q = new URLSearchParams();
    if (filters.isActive !== undefined) q.set('isActive', String(filters.isActive));
    if (filters.hub !== undefined) q.set('hub', String(filters.hub));
    const qs = q.toString();
    const response = await apiClient.get<Country[]>(`/countries${qs ? `?${qs}` : ''}`);
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

  /** Places with published roles right now, each with a live count. */
  async getJobLocations(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/locations');
    if (!response.success || !Array.isArray(response.data)) return [];
    return response.data;
  },

  /** One place plus its sibling suburbs, for the location landing page. */
  async getJobLocation(slug: string): Promise<any | null> {
    const response = await apiClient.get<any>(`/locations/${slug}`);
    return response.success ? response.data : null;
  },

  /** Filter options with live counts, for the search page's sidebar. */
  async getJobFacets(): Promise<any | null> {
    const response = await apiClient.get<any>('/job-facets');
    return response.success ? response.data : null;
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

  /** Creates a job listing. Returns the created row, or throws with the API's message. */
  async createJob(payload: Record<string, unknown>) {
    const response = await apiClient.post('/jobs', payload);
    if (!response.success || !response.data) {
      throw new AppError(response.error || 'Failed to create the job', 500);
    }
    return response.data;
  },

  async updateJob(id: string, payload: Record<string, unknown>) {
    const response = await apiClient.patch(`/jobs/${id}`, payload);
    if (!response.success || !response.data) {
      throw new AppError(response.error || 'Failed to update the job', 500);
    }
    return response.data;
  },

  /** Moves a draft to published so it appears on the public site and in the sitemap. */
  async publishJob(id: string) {
    const response = await apiClient.post(`/jobs/${id}/publish`, {});
    if (!response.success) throw new AppError(response.error || 'Failed to publish the job', 500);
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
