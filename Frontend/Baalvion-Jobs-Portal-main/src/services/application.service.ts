
import { ApplicationStatus, ApplicationWithCandidate, MultiPhaseApplicationData } from '@/types';
import { apiClient } from '@/lib/apiClient';
import { uploadFile, isFile } from '@/lib/fileUpload';
import { TableQuery, PaginatedResponse } from '@/components/system/DataTable';
import { adapter } from './adapter';

export const applicationService = {
  async submitMultiPhaseApplication(countrySlug: string, data: MultiPhaseApplicationData): Promise<{ success: boolean; applicationId: string; }> {
      // The form carries real File objects (resume, certifications, photoId, …). Upload each to
      // MinIO first (public, anonymous applicant) and replace it with a `<field>Url` string so the
      // payload is JSON-serializable and the backend stores the resume URL on the application.
      const payload: Record<string, any> = {};
      for (const [k, v] of Object.entries(data as Record<string, any>)) {
        if (isFile(v)) {
          try {
            const url = await uploadFile(v, { folder: 'applications', public: true });
            payload[`${k}Url`] = url;
            if (k === 'resume') payload.resumeUrl = url;
          } catch { /* skip a failed optional upload */ }
        } else {
          payload[k] = v;
        }
      }

      // Use relative URL to route through the Next.js API handler,
      // not through apiClient (which targets the jobs-service base URL)
      const res = await fetch(`/api/${countrySlug}/application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    const response = await apiClient.get<MultiPhaseApplicationData>(`/applications/${id}`);
    if (!response.success) {
      console.error(response.error);
      return null;
    }
    return response.data;
  },

  getApplicationDetails(id: string) {
    return adapter.getApplicationDetails(id);
  },
  /** Candidate's own application detail (email-scoped) for the my-account portal. */
  getMyApplicationDetail(id: string) {
    return (adapter as any).getMyApplicationDetail(id);
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
