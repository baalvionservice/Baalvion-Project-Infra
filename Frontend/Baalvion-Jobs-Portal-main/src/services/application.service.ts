
import { ApplicationStatus, ApplicationWithCandidate, MultiPhaseApplicationData } from '@/types';
import { apiClient } from '@/lib/apiClient';
import { TableQuery, PaginatedResponse } from '@/components/system/DataTable';
import { adapter } from './adapter';

export const applicationService = {
  async submitMultiPhaseApplication(countrySlug: string, data: MultiPhaseApplicationData): Promise<{ success: boolean; applicationId: string; }> {
      // Use relative URL to route through the Next.js API handler,
      // not through apiClient (which targets the jobs-service base URL)
      const res = await fetch(`/api/${countrySlug}/application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      let json: any;
      try { json = await res.json(); } catch { json = {}; }
      if (!res.ok || !json.success) {
        throw new Error(json?.error || 'Multi-phase application submission failed');
      }
      return { success: true, applicationId: json.data.applicationId };
  },

  async getApplications(query: TableQuery): Promise<PaginatedResponse<ApplicationWithCandidate>> {
    return adapter.getApplications(query);
  },

  async getDetailedApplication(id: string): Promise<MultiPhaseApplicationData | null> {
    const response = await apiClient.get<MultiPhaseApplicationData>(`/api/applications/${id}`);
    if (!response.success) {
      console.error(response.error);
      return null;
    }
    return response.data;
  },

  getApplicationDetails(id: string) {
    return adapter.getApplicationDetails(id);
  },
  updateApplicationStatus(id: string, status: ApplicationStatus) {
    return adapter.updateApplicationStatus(id, status);
  },
  getApplicationsForUser(userId: string) {
    return adapter.getApplicationsForUser(userId);
  },
  scheduleInterview(applicationId: string, dateTime: string) {
    return adapter.scheduleInterview(applicationId, dateTime);
  },
  sendOffer(applicationId: string) {
    return adapter.sendOffer(applicationId);
  },
  rejectApplication(applicationId: string) {
    return adapter.rejectApplication(applicationId);
  }
};
