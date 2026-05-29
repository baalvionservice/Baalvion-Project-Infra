// @ts-nocheck — bridge adapter; return types are cast at export
import type { ApiAdapter } from '../api.adapter';
import { apiClient } from '@/lib/apiClient';
import { uploadFile } from '@/lib/fileUpload';
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
    countryId: j.country_id ?? j.countryId ?? 'country_in',
    city: j.location ?? 'Remote',
    state: undefined,
    departmentId: j.department_id ?? j.departmentId ?? 'dept_eng_it',
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

// Backend candidate (snake_case) → portal Candidate type used by the admin table/forms.
function mapBackendCandidate(c: any) {
  return {
    id: String(c.id),
    name: c.full_name ?? c.fullName ?? c.name ?? 'Unknown',
    email: c.email ?? '',
    phone: c.phone ?? '',
    jobTitle: c.headline ?? c.job_title ?? c.jobTitle ?? '—',
    experienceYears: Number(c.years_of_experience ?? c.yearsOfExperience ?? 0),
    stage: String(c.stage ?? 'APPLIED').toUpperCase(),
    rating: Number(c.rating ?? 0),
    createdAt: c.created_at ?? c.createdAt ?? new Date().toISOString(),
    tenantId: String(c.org_id ?? c.orgId ?? ''),
    avatarUrl: c.avatar_url ?? c.avatarUrl ?? '',
    skills: c.skills ?? [],
    location: c.location ?? '',
    source: c.source ?? '',
  };
}

// Backend application (snake_case, with nested candidate/job) → portal ApplicationWithCandidate.
function mapBackendApplication(a: any) {
  const cand = a.candidate ?? {};
  const job = a.job ?? {};
  return {
    id: String(a.id),
    candidateId: String(a.candidate_id ?? cand.id ?? ''),
    jobId: String(a.job_id ?? job.id ?? ''),
    status: String(a.status ?? 'applied').toUpperCase(),
    createdAt: a.created_at ?? new Date().toISOString(),
    candidateName: cand.full_name ?? cand.fullName ?? cand.name ?? 'Unknown',
    candidateEmail: cand.email ?? '',
    candidateAvatarUrl: cand.avatar_url ?? '',
    jobTitle: job.title ?? '—',
    score: a.score ?? null,
  };
}

// Backend interview (snake_case, nested application→candidate/job) → portal Interview.
function mapBackendInterview(i: any) {
  const cand = i.application?.candidate ?? {};
  const job = i.application?.job ?? {};
  return {
    id: String(i.id),
    applicationId: String(i.application_id ?? ''),
    candidateName: cand.full_name ?? cand.fullName ?? 'Unknown',
    candidateEmail: cand.email ?? '',
    jobTitle: job.title ?? '—',
    status: String(i.status ?? 'scheduled').toUpperCase(),
    stage: i.type === 'technical' ? 'TECHNICAL_ROUND' : 'INTERVIEW',
    type: i.type ?? 'video',
    scheduledAt: i.scheduled_at ?? i.scheduledAt ?? new Date().toISOString(),
    meetingLink: i.meeting_url ?? i.meetingLink ?? '#',
    durationMinutes: i.duration_minutes ?? 60,
    interviewerNames: Array.isArray(i.interviewer_names) ? i.interviewer_names : ['Interviewer'],
    feedback: i.feedback ?? '',
    rating: i.rating ?? null,
  };
}

// Backend document → portal Document (candidate portal + admin docs table).
function mapDocument(d: any) {
  return {
    id: String(d.id),
    candidateId: String(d.candidate_id ?? d.candidateId ?? ''),
    name: d.file_name ?? d.fileName ?? 'Document',
    fileName: d.file_name ?? d.fileName ?? 'Document',
    type: d.document_type ?? d.documentType ?? 'OTHER',
    documentType: d.document_type ?? d.documentType ?? 'OTHER',
    url: d.file_url ?? d.fileUrl ?? '#',
    country: d.country ?? '',
    status: String(d.status ?? 'PENDING').toUpperCase(),
    uploadedAt: d.created_at ?? d.createdAt ?? new Date().toISOString(),
  };
}

// Backend offer (snake_case, nested application→job) → portal Offer.
function mapOffer(o: any) {
  return {
    id: String(o.id),
    applicationId: String(o.application_id ?? ''),
    status: String(o.status ?? 'DRAFT').toUpperCase(),
    baseSalary: Number(o.base_salary ?? 0),
    equityValue: Number(o.equity_value ?? 0),
    bonus: Number(o.bonus ?? 0),
    currency: o.currency ?? 'INR',
    position: o.application?.job?.title ?? '—',
    candidateName: o.application?.candidate?.full_name ?? '',
    createdAt: o.created_at ?? new Date().toISOString(),
    validUntil: o.valid_until ?? null,
    approvals: o.approvals ?? [],
  };
}

// Portal Candidate (camelCase) → backend createCandidate/updateCandidate body (snake_case).
function toBackendCandidate(c: any) {
  const out: any = {};
  if (c.email !== undefined) out.email = c.email;
  if (c.name !== undefined || c.fullName !== undefined) out.full_name = c.name ?? c.fullName;
  if (c.phone !== undefined) out.phone = c.phone;
  if (c.jobTitle !== undefined || c.headline !== undefined) out.headline = c.jobTitle ?? c.headline;
  if (c.experienceYears !== undefined) out.years_of_experience = Number(c.experienceYears) || 0;
  if (c.location !== undefined) out.location = c.location;
  if (Array.isArray(c.skills)) out.skills = c.skills;
  if (c.linkedinUrl) out.linkedin_url = c.linkedinUrl;
  if (c.portfolioUrl) out.portfolio_url = c.portfolioUrl;
  const src = String(c.source ?? '').toLowerCase();
  if (['referral', 'linkedin', 'job_board', 'direct'].includes(src)) out.source = src;
  return out;
}

// campus controllers return { success, data: rows, pagination } at top level → DataTable shape.
async function campusPaginated(apiCall: Promise<any>, mapper?: (x: any) => any) {
  const res = await apiCall;
  const rows: any[] = res?.data ?? [];
  const pg = res?.pagination ?? {};
  const data = mapper ? rows.map(mapper) : rows;
  return {
    data,
    total: pg.total ?? data.length,
    page: pg.page ?? 1,
    limit: pg.limit ?? 20,
    totalPages: pg.totalPages ?? 1,
  };
}

const rawServerAdapter = ({
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
  updateCandidateStatus:(id, stage) => apiClient.patch(`/candidates/${id}`, { status: String(stage).toLowerCase() === 'inactive' ? 'inactive' : 'active' }),
  createCandidate:      (data) => apiClient.post('/candidates', toBackendCandidate(data)),
  getCandidateProfile:  (id) => apiClient.get(`/candidates/${id}`),
  getLatestCandidates:  (limit = 5) => normalizePaginated(apiClient.get(`/candidates?sort=latest&limit=${limit}`), mapBackendCandidate).then((r) => r.data),
  getCandidates: (params) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    ).toString();
    return normalizePaginated(apiClient.get(`/candidates${q ? `?${q}` : ''}`), mapBackendCandidate);
  },

  // ── Applications ────────────────────────────────────────────────────────────
  getApplications: (query) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(query ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    ).toString();
    return normalizePaginated(apiClient.get(`/applications${q ? `?${q}` : ''}`), mapBackendApplication);
  },
  getApplicationsForUser: async () => { const r = await apiClient.get('/me/applications'); return (r.data ?? []).map(mapBackendApplication); },
  updateApplicationStatus:(id, status) => apiClient.patch(`/applications/${id}`, { status: String(status).toLowerCase() }),
  sendOffer:              (applicationId) => apiClient.post(`/applications/${applicationId}/offer`, {}),
  rejectApplication:      (applicationId) => apiClient.patch(`/applications/${applicationId}`, { status: 'rejected' }),
  getApplicationDetails:  (id) => apiClient.get(`/applications/${id}`),
  // Candidate-scoped (by email) application detail for /my-account — staff use getApplicationDetails.
  getMyApplicationDetail: async (id) => {
    const r = await apiClient.get(`/me/applications/${id}`);
    const a: any = r.data;
    if (!a) return null;
    return {
      application: mapBackendApplication(a),
      candidate: a.candidate ? mapBackendCandidate(a.candidate) : null,
      interviews: (a.interviews ?? []).map(mapBackendInterview),
      stageHistory: [],
      documents: [],
    };
  },

  // ── Interviews ──────────────────────────────────────────────────────────────
  getAllInterviews:           async () => { const r = await apiClient.get('/interviews'); const items = (r.data?.items ?? r.data ?? []); return items.map(mapBackendInterview); },
  getInterviewsForCandidate:  async () => { const r = await apiClient.get('/me/interviews'); return (r.data ?? []).map(mapBackendInterview); },
  schedule:                   (data: any) => apiClient.post('/interviews', {
                                  application_id: Number(data.applicationId ?? data.application_id),
                                  scheduled_at: new Date(data.scheduledAt ?? data.dateTime ?? data.scheduled_at ?? Date.now()).toISOString(),
                                  type: String(data.type ?? 'video').toLowerCase(),
                                  duration_minutes: Number(data.durationMinutes ?? data.duration_minutes ?? 60),
                                  location: data.location,
                                }),
  scheduleInterview:          (applicationId, dateTime) => apiClient.post('/interviews', { application_id: Number(applicationId), scheduled_at: new Date(dateTime).toISOString() }),
  updateInterviewStatus:      (id, status) => apiClient.patch(`/interviews/${id}`, { status: String(status).toLowerCase() }),
  submitInterviewFeedback:    (id, feedback, rating) => apiClient.post(`/interviews/${id}/feedback`, { feedback, rating: Number(rating) }),

  // ── Offers ──────────────────────────────────────────────────────────────────
  getAllOffers:           () => apiClient.get('/offers'),
  deleteOffer:           (id) => apiClient.delete(`/offers/${id}`),
  getOfferForApplication:(applicationId) => apiClient.get(`/offers?applicationId=${applicationId}`),
  createOffer:           (data) => apiClient.post('/offers', data),
  updateOfferStatus:     (offerId, status) => apiClient.patch(`/offers/${offerId}`, { status }),
  getOffersForCandidate: async () => { const r = await apiClient.get('/me/offers'); return (r.data ?? []).map(mapOffer); },
  updateCandidateResponse:(offerId, response) => apiClient.patch(`/me/offers/${offerId}/response`, { response }),

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
  getColleges:        (query) => campusPaginated(apiClient.get(`/campus/colleges?${new URLSearchParams(query ?? {}).toString()}`)),
  getAllColleges:      () => apiClient.get('/campus/colleges'),
  createCollege:      (data) => apiClient.post('/campus/colleges', data),
  updateCollege:      (data) => apiClient.patch(`/campus/colleges/${(data as Record<string,unknown>).id}`, data),
  deleteCollege:      (id) => apiClient.delete(`/campus/colleges/${id}`),

  // ── Students ────────────────────────────────────────────────────────────────
  getStudents:        (query) => campusPaginated(apiClient.get(`/campus/students?${new URLSearchParams(query ?? {}).toString()}`)),
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
  uploadDocument:         async (data: any) => {
                            // Upload the actual file to MinIO first, then persist the metadata + URL.
                            let fileUrl = data.fileUrl;
                            if (data.file) fileUrl = await uploadFile(data.file, { folder: 'documents' });
                            const r = await apiClient.post('/documents', {
                              candidateId: data.candidateId, documentType: data.documentType,
                              fileName: data.file?.name ?? data.fileName, fileUrl,
                              country: data.country, issueDate: data.issueDate,
                            });
                            return mapDocument(r.data ?? {});
                          },
  requestDocumentDeletion:(id) => apiClient.patch(`/documents/${id}`, { status: 'DELETION_REQUESTED' }),
  updateDocumentStatus:   (id, status) => apiClient.patch(`/documents/${id}`, { status: String(status).toUpperCase() }),
  approveDeletion:        (id) => apiClient.delete(`/documents/${id}`),
  getDocumentsForCandidate: async (candidateId: string) => { const r = await apiClient.get(`/candidates/${candidateId}/documents`); return (r.data ?? []).map(mapDocument); },
  getAllDocuments:          async () => { const r = await apiClient.get('/documents'); return (r.data ?? []).map(mapDocument); },

  // ── Notes ───────────────────────────────────────────────────────────────────
  addNote: (data: any) => apiClient.post('/notes', { candidateId: data.candidateId ?? data.candidate_id, content: data.content, authorName: data.authorName }),

  // ── Misc ────────────────────────────────────────────────────────────────────
  sendEmail: (email, subject, body) => apiClient.post('/notifications/email', { email, subject, body }),
  logEvent:  (event) => apiClient.post('/audit/events', event),
  getAuditLogs: async (filters: any, limit = 100) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries({ ...(filters || {}), limit }).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    ).toString();
    const r = await apiClient.get(`/audit/logs${params ? `?${params}` : ''}`);
    const logs = (r.data?.logs ?? r.data ?? []) as any[];
    return { logs: logs.map((l: any) => ({
      id: String(l.id),
      action: l.action,
      actor: l.actor_name ?? l.actorName ?? 'System',
      actorId: String(l.actor_id ?? l.actorId ?? ''),
      entityType: l.entity_type ?? l.entityType,
      entityId: l.entity_id ?? l.entityId,
      details: l.details,
      tenantId: String(l.org_id ?? l.orgId ?? ''),
      timestamp: l.created_at ?? l.createdAt ?? new Date().toISOString(),
    })) };
  },

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
});

// ── Auto-unwrap + camelCase wrapper ───────────────────────────────────────────
// The backend speaks { success, data, meta } envelopes with snake_case fields; the
// portal components want plain data with camelCase keys. This wrapper applies both
// uniformly so individual methods don't each have to. Methods that already return a
// mapped shape (getTalentJobs → PaginatedResponse, getCandidates → normalizePaginated)
// are passed through untouched (their result is not an ApiResponse envelope).
const _snakeToCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const _camelKeys = (v: any): any => {
  if (Array.isArray(v)) return v.map(_camelKeys);
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const out: any = {};
    for (const [k, val] of Object.entries(v)) {
      const ck = _snakeToCamel(k);
      out[ck] = _camelKeys(val);
      if (ck !== k) out[k] = out[ck]; // keep snake alias too — defensive for mixed consumers
    }
    return out;
  }
  return v;
};
// Backend envelope is { success, data, meta } (no `error` on success). Pagination helpers
// return { data, total, page, ... } (no `success`) and must pass through untouched.
const _isEnvelope = (v: any) => v && typeof v === 'object' && 'success' in v && 'data' in v;

const _unwrapEnvelope = (res: any) => {
  if (_isEnvelope(res)) {
    if (!res.success) return Array.isArray(res.data) ? [] : null;
    return _camelKeys(res.data);
  }
  return res;
};

export const serverAdapter = new Proxy(rawServerAdapter, {
  get(target, prop: string) {
    const orig = (target as any)[prop];
    if (typeof orig !== 'function') return orig;
    return (...args: any[]) => {
      const result = orig(...args);
      // Only transform async (Promise) results; sync returns (e.g. subscribe → cleanup fn) pass through.
      if (result && typeof result.then === 'function') {
        return result.then(_unwrapEnvelope);
      }
      return result;
    };
  },
}) as unknown as ApiAdapter;
