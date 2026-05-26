// @ts-nocheck — bridge adapter; return types are cast at export
import type { ApiAdapter } from '../api.adapter';
import { apiClient } from '@/lib/apiClient';
import { authServerService } from './auth.server';
import { userServerService } from './user.server';
import { candidateServerService } from './candidate.server';
import { applicationServerService } from './application.server';
import { interviewServerService } from './interview.server';
import { offerServerService } from './offer.server';
import { analyticsServerService } from './analytics.server';
import { auditServerService } from './audit.server';
import { notificationServerService } from './notification.server';
import { projectServerService } from './project.server';
import { organizationServerService } from './organization.server';
import { paymentServerService } from './payment.server';
import { teamServerService } from './team.server';
import { talentServerService } from './talent.server';
import { noteServerService } from './note.server';
import { documentServerService } from './document.server';
import { studentServerService } from './student.server';
import { campusServerService } from './campus.server';

const JOB_TYPE_MAP: Record<string, string> = {
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  contract: 'Contractor',
  internship: 'Internship',
};

const EXP_BAND_MAP: Record<string, string> = {
  entry: '0-2 Years',
  mid: '2-5 Years',
  senior: '5-10 Years',
  lead: '10+ Years',
};

const STATUS_MAP: Record<string, string> = {
  published: 'Active',
  draft: 'Draft',
  closed: 'Closed',
};

// Normalizes { items, pagination } from jobs-service to PaginatedResponse<T>
async function normalizePaginated<T>(
  apiCall: Promise<{ success: boolean; data: any; error: string | null }>,
  mapper?: (item: any) => T,
): Promise<{ data: T[]; total: number; page: number; limit: number; totalPages: number }> {
  const res = await apiCall;
  if (!res.success || !res.data) return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  const raw = res.data as any;
  const items: any[] = raw.items ?? raw.data ?? [];
  const pg = raw.pagination ?? {};
  return {
    data: mapper ? items.map(mapper) : items,
    total: pg.total ?? items.length,
    page: pg.page ?? 1,
    limit: pg.limit ?? 20,
    totalPages: pg.totalPages ?? 1,
  };
}

function mapBackendJob(j: any) {
  return {
    id: String(j.id),
    requisitionCode: `JOB-${String(j.id).padStart(4, '0')}`,
    title: j.title ?? '',
    countryId: j.countryId ?? 'global',
    city: j.location ?? 'Remote',
    state: undefined,
    departmentId: j.departmentId ?? 'general',
    employmentType: JOB_TYPE_MAP[j.job_type] ?? 'Full-Time',
    experienceBand: EXP_BAND_MAP[j.experience_level] ?? '2-5 Years',
    workforceType: 'Employee',
    salaryBand: j.salary_min && j.salary_max ? `${j.salary_min}-${j.salary_max}` : undefined,
    currency: j.currency ?? 'INR',
    salaryVisibility: (j.salary_min ? 'range' : 'hidden') as any,
    equityEligible: false,
    relocationSupport: false,
    visaSponsorship: false,
    status: (STATUS_MAP[j.status] ?? 'Active') as any,
    visibility: (j.status === 'published' ? 'public' : 'internal') as any,
    description: j.description ?? '',
    responsibilities: [],
    qualifications: j.requirements ? [j.requirements] : [],
    remoteAllowed: j.remote_allowed ?? false,
    requiredSkills: (j.skills ?? []).map((s: any) => s.name ?? s),
    publishStartDate: j.published_at ?? j.created_at,
    publishEndDate: j.closes_at ?? j.deadline,
    tenantId: j.org_id ? String(j.org_id) : undefined,
    createdAt: j.created_at ?? new Date().toISOString(),
    updatedAt: j.updated_at ?? new Date().toISOString(),
  };
}

export const serverAdapter = ({
  ...authServerService,
  ...userServerService,
  ...candidateServerService,
  ...applicationServerService,
  ...interviewServerService,
  ...offerServerService,
  ...analyticsServerService,
  ...auditServerService,
  ...notificationServerService,
  ...projectServerService,
  ...organizationServerService,
  ...paymentServerService,
  ...teamServerService,
  ...talentServerService,
  ...noteServerService,
  ...documentServerService,
  ...studentServerService,
  ...campusServerService,

  // ── Candidate ───────────────────────────────────────────────────────────────
  getCandidateById:     (id) => apiClient.get(`/candidates/${id}`),
  updateCandidateStatus:(id, stage) => apiClient.patch(`/candidates/${id}`, { stage }),
  createCandidate:      (data) => apiClient.post('/candidates', data),
  getCandidateProfile:  (id) => apiClient.get(`/candidates/${id}`),
  getLatestCandidates:  (limit = 5) => apiClient.get(`/candidates?sort=latest&limit=${limit}`),
  getCandidates: (params) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    ).toString();
    return normalizePaginated(apiClient.get(`/candidates${q ? `?${q}` : ''}`));
  },

  // ── Applications ────────────────────────────────────────────────────────────
  getApplications: (query) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(query ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    ).toString();
    return normalizePaginated(apiClient.get(`/applications${q ? `?${q}` : ''}`));
  },
  getApplicationsForUser: (userId) => apiClient.get(`/applications?userId=${userId}`),
  updateApplicationStatus:(id, status) => apiClient.patch(`/applications/${id}`, { status }),
  sendOffer:              (applicationId) => apiClient.post(`/applications/${applicationId}/offer`, {}),
  rejectApplication:      (applicationId) => apiClient.patch(`/applications/${applicationId}`, { status: 'rejected' }),
  getApplicationDetails:  (id) => apiClient.get(`/applications/${id}`),

  // ── Interviews ──────────────────────────────────────────────────────────────
  getAllInterviews:           () => apiClient.get('/interviews'),
  getInterviewsForCandidate:  (candidateId) => apiClient.get(`/interviews?candidateId=${candidateId}`),
  schedule:                   (data) => apiClient.post('/interviews', data),
  scheduleInterview:          (applicationId, dateTime) => apiClient.post('/interviews', { applicationId, scheduledAt: dateTime }),
  updateInterviewStatus:      (id, status) => apiClient.patch(`/interviews/${id}`, { status }),
  submitInterviewFeedback:    (id, feedback, rating) => apiClient.post(`/interviews/${id}/feedback`, { feedback, rating }),

  // ── Offers ──────────────────────────────────────────────────────────────────
  getAllOffers:           () => apiClient.get('/offers'),
  deleteOffer:           (id) => apiClient.delete(`/offers/${id}`),
  getOfferForApplication:(applicationId) => apiClient.get(`/offers?applicationId=${applicationId}`),
  createOffer:           (data) => apiClient.post('/offers', data),
  updateOfferStatus:     (offerId, status) => apiClient.patch(`/offers/${offerId}`, { status }),
  getOffersForCandidate: (candidateId) => apiClient.get(`/offers?candidateId=${candidateId}`),
  updateCandidateResponse:(offerId, response) => apiClient.patch(`/offers/${offerId}/response`, response),

  // ── Jobs ────────────────────────────────────────────────────────────────────
  getJobs: (params) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    ).toString();
    return apiClient.get(`/jobs${q ? `?${q}` : ''}`);
  },

  // ── Users ───────────────────────────────────────────────────────────────────
  create:     (user) => apiClient.post('/users', user),
  update:     (id, user) => apiClient.patch(`/users/${id}`, user),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),

  // ── Organizations ───────────────────────────────────────────────────────────
  getUserOrganizations: (userId) => apiClient.get(`/organizations?userId=${userId}`),

  // ── Payments ────────────────────────────────────────────────────────────────
  getPayments:    () => apiClient.get('/payments'),
  approvePayment: (id) => apiClient.patch(`/payments/${id}`, { status: 'approved' }),
  rejectPayment:  (id) => apiClient.patch(`/payments/${id}`, { status: 'rejected' }),

  // ── Notifications ───────────────────────────────────────────────────────────
  getNotificationsForCandidate: (candidateId) => apiClient.get(`/notifications?candidateId=${candidateId}`),
  sendNotification:             (userId, notification) => apiClient.post('/notifications', { userId, ...notification }),
  markAsRead:                   (id) => apiClient.patch(`/notifications/${id}/read`, {}),
  markAllAsRead:                (tenantId) => apiClient.patch(`/notifications/read-all`, { tenantId }),
  subscribeToNotifications:     (_callback) => () => { /* WebSocket handled separately */ },

  // ── Dashboard ───────────────────────────────────────────────────────────────
  getDashboardData: (filters) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(filters ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    ).toString();
    return apiClient.get(`/analytics/hiring${q ? `?${q}` : ''}`);
  },

  // ── Campus / Colleges ───────────────────────────────────────────────────────
  getColleges:        (query) => apiClient.get(`/campus/colleges?${new URLSearchParams(query ?? {}).toString()}`),
  getAllColleges:      () => apiClient.get('/campus/colleges'),
  createCollege:      (data) => apiClient.post('/campus/colleges', data),
  updateCollege:      (data) => apiClient.patch(`/campus/colleges/${(data as Record<string,unknown>).id}`, data),
  deleteCollege:      (id) => apiClient.delete(`/campus/colleges/${id}`),

  // ── Students ────────────────────────────────────────────────────────────────
  getStudents:        (query) => apiClient.get(`/campus/students?${new URLSearchParams(query ?? {}).toString()}`),
  getAllStudents:      () => apiClient.get('/campus/students'),
  createStudent:      (data) => apiClient.post('/campus/students', data),
  updateStudent:      (data) => apiClient.patch(`/campus/students/${(data as Record<string,unknown>).id}`, data),
  deleteStudent:      (id) => apiClient.delete(`/campus/students/${id}`),

  // ── Placements ──────────────────────────────────────────────────────────────
  getPendingPlacements:  () => apiClient.get('/campus/placements?approved=false'),
  getApprovedPlacements: () => apiClient.get('/campus/placements?approved=true'),
  approvePlacement:      (id, updates) => apiClient.patch(`/campus/placements/${id}`, { approved: true, ...updates }),
  getRecentPlacements:   (limit = 10) => apiClient.get(`/campus/placements?approved=true&limit=${limit}`),

  // ── AI / Talent matching ────────────────────────────────────────────────────
  getAIMatches: (query) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(query ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    ).toString();
    return apiClient.get(`/talent/matches${q ? `?${q}` : ''}`);
  },

  // ── Documents ───────────────────────────────────────────────────────────────
  uploadDocument:         (data) => apiClient.post('/documents', data),
  requestDocumentDeletion:(id) => apiClient.patch(`/documents/${id}`, { status: 'deletion_requested' }),
  updateDocumentStatus:   (id, status) => apiClient.patch(`/documents/${id}`, { status }),
  approveDeletion:        (id) => apiClient.delete(`/documents/${id}`),

  // ── Notes ───────────────────────────────────────────────────────────────────
  addNote: (data) => apiClient.post('/notes', data),

  // ── Misc ────────────────────────────────────────────────────────────────────
  sendEmail: (email, subject, body) => apiClient.post('/notifications/email', { email, subject, body }),
  logEvent:  (event) => apiClient.post('/audit/events', event),

  // ── Talent (Public) — live jobs from jobs-service; static reference data from mock ──
  getTalentJobs: async (filters = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      ),
    ).toString();
    const res = await apiClient.get(`/jobs${q ? `?${q}` : ''}`);
    if (!res.success || !res.data) return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    // Map backend pagination shape { items, pagination } → PaginatedResponse<Job>
    const raw = res.data as any;
    const items: any[] = raw.items ?? raw.data ?? [];
    const pg = raw.pagination ?? {};
    return {
      data: items.map(mapBackendJob),
      total: pg.total ?? items.length,
      page: pg.page ?? 1,
      limit: pg.limit ?? 20,
      totalPages: pg.totalPages ?? 1,
    };
  },
  getTalentJobById: async (id) => {
    const res = await apiClient.get(`/jobs/${id}`);
    if (!res.success || !res.data) return undefined;
    return mapBackendJob(res.data as any);
  },
  getTalentCountries:         (filters?) => talentServerService.getCountries(filters),
  getTalentCountryBySlug:     (slug) => talentServerService.getCountryBySlug(slug),
  getTalentCountryById:       (id) => talentServerService.getCountryById(id),
  getTalentDepartments:       (filters?) => talentServerService.getDepartments(filters),
  getTalentComplianceProfile: (id) => talentServerService.getComplianceProfile(id),
  getTalentRolesByCountry:    (slug) => talentServerService.getRolesByCountry(slug),
}) as unknown as ApiAdapter;
