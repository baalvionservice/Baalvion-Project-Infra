
'use server';

import * as mockApi from './mock-api';
import * as dataLayer from './data-layer';
import type { User, UserRole, Company, Task, Submission, Evaluation, Plan, Subscription, TaskDifficulty, TaskStatus, SubmissionStatus, Notification, TaskTemplate, Invoice, Team, Activity, SystemMetric, ServiceStatus, ServiceLoad, ScalingEvent, SystemIncident, SystemLog, SystemError, PlanUsage, UsageMetric, RevenueMetric, PlanDistribution, RevenueSource, TestCase, GitHubRepository, Webhook, WebhookTriggerLog, ApiIntegration, IntegrationLog } from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
// ctm-service is /api/v1/ecosystem/ctm at the gateway (was wrongly pointed at :3011 = cms-service).
const CTM_BASE = process.env.NEXT_PUBLIC_CTM_API_URL || 'https://api.baalvion.com/api/v1/ecosystem/ctm/api/v1';

// ── Server-side fetch helper (no auth — optionalAuth endpoints) ──────────────
async function ctmGet<T>(path: string): Promise<T> {
  const res = await fetch(`${CTM_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`CTM API ${res.status} on ${path}`);
  const json = await res.json();
  // Handles both paginated { data: [], total } and plain array responses
  if (json && typeof json === 'object' && 'data' in json && Array.isArray(json.data)) return json.data as T;
  if (json && typeof json === 'object' && 'data' in json) return json.data as T;
  return json as T;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapDifficulty(d: string): TaskDifficulty {
  const map: Record<string, TaskDifficulty> = {
    beginner: 'Beginner', easy: 'Beginner',
    intermediate: 'Intermediate', medium: 'Intermediate',
    advanced: 'Advanced', hard: 'Advanced',
    expert: 'Expert',
  };
  return map[d?.toLowerCase()] ?? 'Intermediate';
}

function mapTaskStatus(s: string): TaskStatus {
  const map: Record<string, TaskStatus> = {
    draft: 'draft', open: 'published', closed: 'closed', archived: 'archived',
  };
  return map[s?.toLowerCase()] ?? 'draft';
}

function mapSubmissionStatus(s: string): SubmissionStatus {
  const map: Record<string, SubmissionStatus> = {
    pending: 'pending',
    under_review: 'in-review',
    accepted: 'shortlisted',
    rejected: 'rejected',
    evaluated: 'evaluated',
  };
  return map[s?.toLowerCase()] ?? 'pending';
}

function mapCtmCompany(c: any): Company {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    ownerId: String(c.owner_user_id ?? ''),
    logoUrl: c.logo_url,
    industry: c.tier,
    createdAt: c.created_at ?? new Date().toISOString(),
    isActive: c.status === 'active',
  };
}

function mapCtmTask(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    instructions: t.requirements ?? '',
    expectedOutputs: '',
    roleCategory: 'Engineering',
    difficulty: mapDifficulty(t.difficulty),
    deadline: t.deadline ?? new Date().toISOString(),
    companyId: t.company_id ?? t.company?.id ?? '',
    createdBy: String(t.created_by ?? ''),
    status: mapTaskStatus(t.status),
    createdAt: t.created_at ?? new Date().toISOString(),
    updatedAt: t.updated_at ?? new Date().toISOString(),
    isOpen: t.status === 'open',
  };
}

function mapCtmSubmission(s: any): Submission {
  return {
    id: s.id,
    taskId: s.task_id,
    userId: String(s.user_id ?? ''),
    companyId: s.task?.company_id ?? '',
    status: mapSubmissionStatus(s.status),
    assignedAt: s.submitted_at ?? s.created_at ?? new Date().toISOString(),
    submittedAt: s.submitted_at,
    lastUpdated: s.updated_at ?? s.submitted_at ?? new Date().toISOString(),
  };
}

function mapCtmEvaluation(e: any): Evaluation {
  return {
    id: e.id,
    submissionId: e.submission_id,
    score: e.score ?? 0,
    feedback: e.feedback ?? '',
    evaluatedBy: String(e.evaluator_id ?? ''),
    evaluatedAt: e.created_at ?? new Date().toISOString(),
    criteriaScores: e.criteria ?? {},
  };
}

function mapCtmUser(u: any): User {
  return {
    id: String(u.user_id ?? u.id),
    name: u.name ?? 'Unknown',
    email: u.email ?? '',
    role: (u.role as UserRole) ?? 'candidate',
    companyId: u.company_id ?? undefined,
    createdAt: u.created_at ?? new Date().toISOString(),
    isActive: u.is_active !== false,
    isVerified: !!u.is_verified,
    consentAccepted: !!u.consent_accepted,
    consentAcceptedAt: u.consent_accepted_at ?? undefined,
    onboardingCompleted: u.onboarding_completed ?? undefined,
    candidateOnboardingCompleted: u.candidate_onboarding_completed ?? undefined,
    profile: {
      avatarUrl: u.avatar_url ?? undefined,
      bio: u.bio ?? undefined,
      location: u.location ?? undefined,
      experienceLevel: u.experience_level ?? undefined,
      skills: Array.isArray(u.skills) ? u.skills : [],
      githubUrl: u.github_url ?? undefined,
      linkedinUrl: u.linkedin_url ?? undefined,
      portfolioLinks: Array.isArray(u.portfolio_links) ? u.portfolio_links : [],
      badgeIds: Array.isArray(u.badges) ? u.badges.map((b: any) => b.badge_id ?? b.badge?.id).filter(Boolean) : undefined,
    },
    candidatePerformance: {
      completedTasks: Number(u.completed_tasks ?? 0),
      averageScore: Number(u.average_score ?? 0),
      ranking: u.rank ?? u.ranking ?? undefined,
    },
  };
}

function mapCtmNotification(n: any): Notification {
  const rel = n.related_entity && n.related_entity.type ? n.related_entity : { type: 'System', id: '' };
  return {
    id: n.id,
    type: n.type,
    priority: n.priority ?? 'Medium',
    status: n.status ?? 'Unread',
    timestamp: n.created_at ?? new Date().toISOString(),
    title: n.title,
    description: n.description ?? '',
    relatedEntity: rel,
  };
}

function mapCtmTemplate(t: any): TaskTemplate {
  return {
    templateId: t.id,
    title: t.title,
    description: t.description ?? '',
    roleCategory: (t.role_category as any) ?? 'Engineering',
    difficulty: mapDifficulty(t.difficulty),
    taskTypes: Array.isArray(t.task_types) ? t.task_types : [],
    instructions: t.instructions ?? '',
    expectedOutputs: t.expected_outputs ?? '',
    timeLimitMinutes: t.time_limit_minutes ?? undefined,
    createdBy: t.company_id,
    createdAt: t.created_at ?? new Date().toISOString(),
    updatedAt: t.updated_at ?? new Date().toISOString(),
    multiRound: t.multi_round ?? false,
    rounds: Array.isArray(t.rounds) ? t.rounds : [],
    isPrivate: t.is_private ?? false,
  };
}

function mapCtmInvoice(i: any): Invoice {
  return {
    id: i.id,
    companyId: i.company_id,
    amount: Number(i.amount ?? 0),
    date: i.issued_at ?? i.created_at ?? new Date().toISOString(),
    dueDate: i.due_date ?? i.issued_at ?? new Date().toISOString(),
    status: i.status ?? 'Pending',
    planName: i.plan_name ?? '',
    pdfUrl: i.pdf_url ?? undefined,
    billingPeriod: { start: i.billing_period_start ?? '', end: i.billing_period_end ?? '' },
    lineItems: Array.isArray(i.line_items) ? i.line_items : [],
    subtotal: Number(i.subtotal ?? 0),
    tax: Number(i.tax ?? 0),
  };
}

function mapCtmTeam(t: any): Team {
  return {
    id: t.id,
    name: t.name,
    companyId: t.company_id,
    memberIds: Array.isArray(t.members) ? t.members.map((m: any) => String(m.user_id ?? m.id)) : [],
    leadId: t.lead_id != null ? String(t.lead_id) : '',
  };
}

function mapCtmActivity(a: any): Activity {
  const target = a.target_entity && a.target_entity.type ? a.target_entity : { type: 'System', id: String(a.target_id ?? '') };
  return {
    id: a.id,
    performerId: String(a.user_id ?? a.actor_id ?? ''),
    actionType: (a.action_type ?? a.type ?? 'task_update') as any,
    timestamp: a.created_at ?? new Date().toISOString(),
    targetEntity: target,
    status: (a.status ?? 'Success') as any,
    description: a.description ?? a.action ?? '',
  };
}

// ── User API ──────────────────────────────────────────────────────────────────
export const getUsers = async (): Promise<User[]> => {
  if (!USE_MOCK) {
    try {
      const ctmUsers = (await ctmGet<any[]>('/users?limit=200')).map(mapCtmUser);
      // Merge mock seed users (so demo profiles still render) without duplicating real ones.
      const realIds = new Set(ctmUsers.map(u => u.id));
      const mock = await dataLayer.getHybridUsers();
      return [...ctmUsers, ...mock.filter(u => !realIds.has(u.id))];
    } catch { /* fallback */ }
  }
  return dataLayer.getHybridUsers();
};

export const getUser = async (id: string): Promise<User | undefined> => {
  if (!USE_MOCK) {
    try { return mapCtmUser(await ctmGet<any>(`/users/${id}`)); }
    catch { /* fallback */ }
  }
  return (await mockApi.getUserById(id)).data;
};

export const getLeaderboard = async (limit = 50): Promise<User[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>(`/leaderboard?limit=${limit}`)).map(mapCtmUser); }
    catch { /* fallback */ }
  }
  const users = await dataLayer.getHybridUsers();
  return users
    .filter(u => u.role === 'candidate')
    .sort((a, b) => (b.candidatePerformance?.averageScore ?? 0) - (a.candidatePerformance?.averageScore ?? 0))
    .slice(0, limit);
};

export const createUser  = mockApi.createUser;
export const updateUser  = mockApi.updateUser;

// ── Company API ───────────────────────────────────────────────────────────────
export const getCompanies = async (): Promise<Company[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>('/companies?limit=100')).map(mapCtmCompany); }
    catch { /* fallback to mock */ }
  }
  return dataLayer.getHybridCompanies();
};

export const getCompany = async (id: string): Promise<Company | undefined> => {
  if (!USE_MOCK) {
    try { return mapCtmCompany(await ctmGet<any>(`/companies/${id}`)); }
    catch { /* fallback */ }
  }
  return (await mockApi.getCompanyById(id)).data;
};

export const createCompany = mockApi.createCompany;

// ── Task API ──────────────────────────────────────────────────────────────────
export const getTasks = async (): Promise<Task[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>('/tasks?limit=100')).map(mapCtmTask); }
    catch { /* fallback */ }
  }
  return dataLayer.getHybridTasks();
};

export const getTask = async (id: string): Promise<Task | undefined> => {
  if (!USE_MOCK) {
    try { return mapCtmTask(await ctmGet<any>(`/tasks/${id}`)); }
    catch { /* fallback */ }
  }
  return (await mockApi.getTaskById(id)).data;
};

export const getTasksByCompany = async (companyId: string): Promise<Task[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>(`/tasks?company_id=${companyId}&limit=100`)).map(mapCtmTask); }
    catch { /* fallback */ }
  }
  const all = await dataLayer.getHybridTasks();
  return all.filter(t => t.companyId === companyId);
};

export const createTask   = mockApi.createTask;
export const assignTask   = mockApi.assignTask;

// ── Submission API ────────────────────────────────────────────────────────────
export const getSubmissions = async (): Promise<Submission[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>('/submissions?limit=100')).map(mapCtmSubmission); }
    catch { /* fallback */ }
  }
  return dataLayer.getHybridSubmissions();
};

export const getSubmission = async (id: string): Promise<Submission | undefined> => {
  if (!USE_MOCK) {
    try { return mapCtmSubmission(await ctmGet<any>(`/submissions/${id}`)); }
    catch { /* fallback */ }
  }
  return (await mockApi.getSubmissionById(id)).data;
};

export const getSubmissionsByUser = async (userId: string): Promise<Submission[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>(`/submissions?user_id=${userId}&limit=100`)).map(mapCtmSubmission); }
    catch { /* fallback */ }
  }
  const all = await dataLayer.getHybridSubmissions();
  return all.filter(s => s.userId === userId);
};

export const getSubmissionsByTask = async (taskId: string): Promise<Submission[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>(`/submissions?task_id=${taskId}&limit=100`)).map(mapCtmSubmission); }
    catch { /* fallback */ }
  }
  const all = await dataLayer.getHybridSubmissions();
  return all.filter(s => s.taskId === taskId);
};

export const createSubmission        = mockApi.createSubmission;
export const updateSubmission        = mockApi.updateSubmission;
export const updateSubmissionStatus  = mockApi.updateSubmissionStatus;

// ── Evaluation API ────────────────────────────────────────────────────────────
export const getEvaluationBySubmission = async (submissionId: string): Promise<Evaluation | undefined> => {
  if (!USE_MOCK) {
    try {
      const rows = await ctmGet<any[]>(`/evaluations?submission_id=${submissionId}&limit=1`);
      if (rows?.length) return mapCtmEvaluation(rows[0]);
      return undefined;
    } catch { /* fallback */ }
  }
  return (await mockApi.getEvaluationBySubmissionId(submissionId)).data;
};

export const getAllEvaluations = async (): Promise<Evaluation[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>('/evaluations?limit=100')).map(mapCtmEvaluation); }
    catch { /* fallback */ }
  }
  return dataLayer.getHybridEvaluations();
};

export const createEvaluation   = mockApi.createEvaluation;
export const getEvaluationSchemas = async () => {
  if (!USE_MOCK) {
    try { return await ctmGet<any[]>('/evaluation-schemas'); }
    catch { /* fallback */ }
  }
  return (await mockApi.getEvaluationSchemas()).data;
};

// ── Payment APIs ──────────────────────────────────────────────────────────────
export const createPayment             = mockApi.createPayment;
export const getInvoicesByCompanyId    = async (companyId: string): Promise<{ success: true; data: Invoice[] }> => {
  if (!USE_MOCK) {
    try { return { success: true, data: (await ctmGet<any[]>(`/invoices?company_id=${companyId}&limit=100`)).map(mapCtmInvoice) }; }
    catch { /* fallback */ }
  }
  return mockApi.getInvoicesByCompanyId(companyId);
};
export const createSubscription        = mockApi.createSubscription;
export const updateSubscription        = mockApi.updateSubscription;
export const getAllSubscriptions        = async () => {
  if (!USE_MOCK) {
    try { return await ctmGet<any[]>('/subscriptions?limit=200'); }
    catch { /* fallback */ }
  }
  return (await mockApi.getAllSubscriptions()).data;
};
export const getAllInvoices             = async (): Promise<Invoice[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>('/invoices?limit=200')).map(mapCtmInvoice); }
    catch { /* fallback */ }
  }
  return (await mockApi.getAllInvoices()).data;
};

export const getAllPlans = async (): Promise<Plan[]> => {
  if (!USE_MOCK) {
    try {
      const raw = await ctmGet<any[]>('/plans');
      return raw.map((p: any): Plan => ({
        id: p.id,
        name: p.name,
        priceMonthly: p.monthly_price ?? 0,
        priceYearly: p.annual_price ?? (p.monthly_price ?? 0) * 10,
        limits: { tasks: -1, submissions: -1, teamMembers: -1 },
        features: Array.isArray(p.features) ? p.features : [],
      }));
    } catch { /* fallback */ }
  }
  return (await mockApi.getAllPlans()).data;
};

export const getSubscriptionByCompany = async (companyId: string) => {
  if (!USE_MOCK) {
    try {
      const subs = await ctmGet<any[]>(`/subscriptions?company_id=${companyId}&limit=1`);
      if (subs?.length) return subs[0];
    } catch { /* fallback */ }
  }
  return (await mockApi.getSubscriptionByCompany(companyId)).data;
};

// ── Badge API ─────────────────────────────────────────────────────────────────
export const getBadges = async () => {
  if (!USE_MOCK) {
    try { return await ctmGet<any[]>('/badges'); }
    catch { /* fallback */ }
  }
  return (await mockApi.getAllBadges()).data;
};

// ── Activity & Notification APIs ───────────────────────────────────────────────
export const getActivityLogs = async (): Promise<Activity[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>('/activities?limit=100')).map(mapCtmActivity); }
    catch { /* fallback */ }
  }
  return dataLayer.getHybridActivities();
};

export const getNotifications = async (): Promise<Notification[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>('/notifications?limit=100')).map(mapCtmNotification); }
    catch { /* fallback */ }
  }
  return dataLayer.getHybridNotifications();
};

// ── Template API ───────────────────────────────────────────────────────────────
export const getTemplates = async (): Promise<TaskTemplate[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>('/templates?limit=100')).map(mapCtmTemplate); }
    catch { /* fallback */ }
  }
  return (await mockApi.getTemplates()).data;
};
export const saveTemplate = mockApi.saveTaskAsTemplate;

// ── Integrations (real: webhooks/GitHub/API registry via ctm-service) ───────────
export const getTestCasesBySubmission = async (submissionId: string): Promise<TestCase[]> => {
  if (!USE_MOCK) {
    try { return await ctmGet<TestCase[]>(`/submissions/${submissionId}/test-cases`); }
    catch { /* fallback */ }
  }
  return (await mockApi.getTestCasesBySubmission(submissionId)).data;
};
export const getGitHubRepositories   = async (): Promise<GitHubRepository[]> => {
  if (!USE_MOCK) {
    try { return await ctmGet<GitHubRepository[]>('/integrations/github/repos'); }
    catch { /* fallback */ }
  }
  return (await mockApi.getGitHubRepositories()).data;
};
export const getWebhooks             = async (): Promise<Webhook[]> => {
  if (!USE_MOCK) {
    try { return await ctmGet<Webhook[]>('/webhooks'); }
    catch { /* fallback */ }
  }
  return (await mockApi.getWebhooks()).data;
};
export const getWebhookTriggerLogs   = async (webhookId: string): Promise<WebhookTriggerLog[]> => {
  if (!USE_MOCK) {
    try { return await ctmGet<WebhookTriggerLog[]>(`/webhooks/${webhookId}/deliveries`); }
    catch { /* fallback */ }
  }
  return (await mockApi.getWebhookTriggerLogs(webhookId)).data;
};
export const getTeams                = async (): Promise<Team[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>('/teams?limit=100')).map(mapCtmTeam); }
    catch { /* fallback */ }
  }
  return (await mockApi.getTeams()).data;
};
export const getApiIntegrations      = async (): Promise<ApiIntegration[]> => {
  if (!USE_MOCK) {
    try { return await ctmGet<ApiIntegration[]>('/api-integrations'); }
    catch { /* fallback */ }
  }
  return (await mockApi.getApiIntegrations()).data;
};
export const getIntegrationLogs      = async (): Promise<IntegrationLog[]> => {
  if (!USE_MOCK) {
    try { return await ctmGet<IntegrationLog[]>('/integration-logs?limit=100'); }
    catch { /* fallback */ }
  }
  return (await mockApi.getIntegrationLogs()).data;
};

// ── Observability (real: prom-client/process/DB via ctm-service) ────────────────
// Backend returns frontend-ready shapes, so these pass through with a mock fallback.
const ctmList = async <T>(path: string, fallback: () => Promise<T[]>): Promise<T[]> => {
  if (!USE_MOCK) {
    try { return await ctmGet<T[]>(path); }
    catch { /* fallback */ }
  }
  return fallback();
};

export const getSystemMetrics   = async (): Promise<SystemMetric[]>   => ctmList('/observability/metrics?limit=30', async () => (await mockApi.getSystemMetrics()).data);
export const getServiceStatus   = async (): Promise<ServiceStatus[]>  => ctmList('/observability/services', async () => (await mockApi.getServiceStatus()).data);
export const getServiceLoad     = async (): Promise<ServiceLoad[]>    => ctmList('/observability/load', async () => (await mockApi.getServiceLoad()).data);
export const getScalingEvents   = async (): Promise<ScalingEvent[]>   => ctmList('/observability/scaling', async () => (await mockApi.getScalingEvents()).data);
export const getSystemIncidents = async (): Promise<SystemIncident[]> => ctmList('/observability/incidents', async () => (await mockApi.getSystemIncidents()).data);
export const getSystemLogs      = async (): Promise<SystemLog[]>      => ctmList('/observability/logs?limit=100', async () => dataLayer.getHybridSystemLogs());
export const getSystemErrors    = async (): Promise<SystemError[]>    => ctmList('/observability/errors?limit=100', async () => dataLayer.getHybridSystemErrors());

// ── Revenue & usage (real: computed from subscriptions/plans/tasks) ─────────────
export const getPlanUsage        = async (companyId?: string): Promise<PlanUsage[]>      => ctmList(`/usage/plan${companyId ? `?company_id=${companyId}` : ''}`, async () => (await mockApi.getPlanUsage()).data);
export const getUsageMetrics     = async (): Promise<UsageMetric[]>      => ctmList('/usage/metrics?days=30', async () => (await mockApi.getUsageMetrics()).data);
export const getRevenueMetrics   = async (): Promise<RevenueMetric[]>    => ctmList('/revenue/metrics?months=6', async () => (await mockApi.getRevenueMetrics()).data);
export const getPlanDistribution = async (): Promise<PlanDistribution[]> => ctmList('/revenue/plan-distribution', async () => (await mockApi.getPlanDistribution()).data);
export const getRevenueSources   = async (): Promise<RevenueSource[]>    => ctmList('/revenue/sources', async () => (await mockApi.getRevenueSources()).data);
