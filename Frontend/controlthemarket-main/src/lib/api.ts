
'use server';

import * as mockApi from './mock-api';
import * as dataLayer from './data-layer';
import type { User, Company, Task, Submission, Evaluation, Plan, Subscription, TaskDifficulty, TaskStatus, SubmissionStatus } from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const CTM_BASE = process.env.NEXT_PUBLIC_CTM_API_URL || 'http://localhost:3011/api/v1';

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

// ── User API ──────────────────────────────────────────────────────────────────
export const getUsers = async () => (await dataLayer.getHybridUsers());
export const getUser  = async (id: string) => (await mockApi.getUserById(id)).data;
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
export const getEvaluationBySubmission = async (submissionId: string) =>
  (await mockApi.getEvaluationBySubmissionId(submissionId)).data;

export const getAllEvaluations = async (): Promise<Evaluation[]> => {
  if (!USE_MOCK) {
    try { return (await ctmGet<any[]>('/evaluations?limit=100')).map(mapCtmEvaluation); }
    catch { /* fallback */ }
  }
  return dataLayer.getHybridEvaluations();
};

export const createEvaluation   = mockApi.createEvaluation;
export const getEvaluationSchemas = async () => (await mockApi.getEvaluationSchemas()).data;

// ── Payment APIs ──────────────────────────────────────────────────────────────
export const createPayment             = mockApi.createPayment;
export const getInvoicesByCompanyId    = async (companyId: string) => (await mockApi.getInvoicesByCompanyId(companyId));
export const createSubscription        = mockApi.createSubscription;
export const updateSubscription        = mockApi.updateSubscription;
export const getAllSubscriptions        = async () => (await mockApi.getAllSubscriptions()).data;
export const getAllInvoices             = async () => (await mockApi.getAllInvoices()).data;

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
export const getActivityLogs   = async () => (await dataLayer.getHybridActivities());
export const getNotifications  = async () => (await dataLayer.getHybridNotifications());

// ── Template API ───────────────────────────────────────────────────────────────
export const getTemplates = async () => (await mockApi.getTemplates()).data;
export const saveTemplate = mockApi.saveTaskAsTemplate;

// ── Other Admin/System APIs ────────────────────────────────────────────────────
export const getTestCasesBySubmission = async (submissionId: string) => (await mockApi.getTestCasesBySubmission(submissionId)).data;
export const getGitHubRepositories   = async () => (await mockApi.getGitHubRepositories()).data;
export const getWebhooks             = async () => (await mockApi.getWebhooks()).data;
export const getWebhookTriggerLogs   = async (webhookId: string) => (await mockApi.getWebhookTriggerLogs(webhookId)).data;
export const getTeams                = async () => (await mockApi.getTeams()).data;
export const getApiIntegrations      = async () => (await mockApi.getApiIntegrations()).data;
export const getIntegrationLogs      = async () => (await mockApi.getIntegrationLogs()).data;
export const getSystemMetrics        = async () => (await mockApi.getSystemMetrics()).data;
export const getServiceStatus        = async () => (await mockApi.getServiceStatus()).data;
export const getServiceLoad          = async () => (await mockApi.getServiceLoad()).data;
export const getScalingEvents        = async () => (await mockApi.getScalingEvents()).data;
export const getSystemIncidents      = async () => (await mockApi.getSystemIncidents()).data;
export const getSystemLogs           = async () => (await dataLayer.getHybridSystemLogs());
export const getSystemErrors         = async () => (await dataLayer.getHybridSystemErrors());
export const getPlanUsage            = async () => (await mockApi.getPlanUsage()).data;
export const getUsageMetrics         = async () => (await mockApi.getUsageMetrics()).data;
export const getRevenueMetrics       = async () => (await mockApi.getRevenueMetrics()).data;
export const getPlanDistribution     = async () => (await mockApi.getPlanDistribution()).data;
export const getRevenueSources       = async () => (await mockApi.getRevenueSources()).data;
