
import { PaginatedResponse } from '@/components/system/DataTable';
import { Job } from '@/lib/talent-acquisition';
import { adapter } from './adapter';
import { talentServerService } from './adapters/server/talent.server';

export const talentService = {
  getCountries: (filters: { isActive?: boolean; hub?: boolean } = {}) => adapter.getTalentCountries(filters),
  getCountryBySlug: (slug: string) => adapter.getTalentCountryBySlug(slug),
  getCountryById: (id: string) => adapter.getTalentCountryById(id),
  getDepartments: (filters: { isActive?: boolean, countryId?: string } = {}) => adapter.getTalentDepartments(filters),
  getJobs: (filters: any = {}): Promise<PaginatedResponse<Job>> => adapter.getTalentJobs(filters),
  getJobById: (id: string) => adapter.getTalentJobById(id),
  getComplianceProfile: (id: string) => adapter.getTalentComplianceProfile(id),
  getRolesByCountry: (slug: string) => adapter.getTalentRolesByCountry(slug),

  // Location surfaces. Driven by real listings, so these never describe a town with
  // nothing open in it.
  getJobLocations: () => talentServerService.getJobLocations(),
  getJobFacets: () => talentServerService.getJobFacets(),
  getJobLocation: (slug: string) => talentServerService.getJobLocation(slug),

  // Authoring. These hit the jobs-service directly rather than through the read
  // adapter — job creation is a staff-only write and has no mock/read equivalent.
  createJob: (payload: Record<string, unknown>) => talentServerService.createJob(payload),
  updateJob: (id: string, payload: Record<string, unknown>) => talentServerService.updateJob(id, payload),
  publishJob: (id: string) => talentServerService.publishJob(id),
};
