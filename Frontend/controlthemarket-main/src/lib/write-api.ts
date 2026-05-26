// Client-side write operations for CTM service.
// NOT 'use server' — runs in the browser, uses the stored auth token.

import { ctmClient } from './ctm-api-client';
import * as mockApi from './mock-api';
import type { Task, Submission, Evaluation } from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// ── Difficulty mapping ────────────────────────────────────────────────────────

const DIFF_TO_BACKEND: Record<string, string> = {
  Beginner: 'easy',
  Intermediate: 'medium',
  Advanced: 'hard',
  Expert: 'expert',
};

// ── Task writes ───────────────────────────────────────────────────────────────

export async function createTask(data: Partial<Task> & {
  title: string;
  companyId: string;
  status?: string;
  deadline?: string;
  difficulty?: string;
  description?: string;
  instructions?: string;
  expectedOutputs?: string;
  taskTypes?: string[];
  roleCategory?: string;
  isPrivate?: boolean;
  timeLimitMinutes?: number;
  rounds?: any[];
}): Promise<{ data: Task | null }> {
  if (USE_MOCK) return mockApi.createTask(data as any);

  try {
    const payload = {
      company_id: data.companyId,
      title: data.title,
      description: data.description,
      requirements: data.instructions || data.expectedOutputs
        ? `${data.instructions ?? ''}\n\nExpected outputs:\n${data.expectedOutputs ?? ''}`
        : undefined,
      tech_stack: data.taskTypes ?? [],
      difficulty: DIFF_TO_BACKEND[data.difficulty ?? 'Intermediate'] ?? 'medium',
      deadline: data.deadline,
      tags: [data.roleCategory, ...(data.taskTypes ?? [])].filter(Boolean),
      metadata: {
        roleCategory: data.roleCategory,
        timeLimitMinutes: data.timeLimitMinutes,
        isPrivate: data.isPrivate,
        multiRound: Array.isArray(data.rounds) && data.rounds.length > 0,
        rounds: data.rounds,
      },
    };

    const created = await ctmClient.post<any>('/tasks', payload);

    // If the user wants it published immediately, publish it
    if (data.status === 'published' && created?.id) {
      try { await ctmClient.post(`/tasks/${created.id}/publish`, {}); } catch { /* non-fatal */ }
    }

    return { data: { id: created.id, ...data } as Task };
  } catch (err: any) {
    throw new Error(err.message ?? 'Failed to create task');
  }
}

// ── Submission writes ─────────────────────────────────────────────────────────

export async function createSubmission(data: {
  taskId: string;
  userId: string;
  codeUrl?: string;
  demoUrl?: string;
  description?: string;
  notes?: string;
}): Promise<{ data: Submission | null }> {
  if (USE_MOCK) return mockApi.createSubmission(data as any);

  try {
    const payload = {
      task_id: data.taskId,
      code_url: data.codeUrl,
      demo_url: data.demoUrl,
      description: data.description,
      notes: data.notes,
    };
    const created = await ctmClient.post<any>('/submissions', payload);
    return {
      data: {
        id: created.id,
        taskId: created.task_id,
        userId: String(created.user_id),
        companyId: created.task?.company_id ?? '',
        status: 'pending',
        assignedAt: created.submitted_at ?? new Date().toISOString(),
        submittedAt: created.submitted_at,
        lastUpdated: created.updated_at ?? new Date().toISOString(),
      },
    };
  } catch (err: any) {
    throw new Error(err.message ?? 'Failed to create submission');
  }
}

export async function assignTask(
  taskId: string,
  userId: string,
): Promise<{ data: Submission | null }> {
  // "Assigning" a task = creating a submission (candidate starts the task)
  return createSubmission({ taskId, userId });
}

export async function updateSubmission(
  submissionId: string,
  updates: Partial<Submission> & {
    codeUrl?: string;
    demoUrl?: string;
  },
): Promise<void> {
  if (USE_MOCK) { await mockApi.updateSubmission(submissionId, updates as any); return; }

  const payload: Record<string, unknown> = {};
  if (updates.codeUrl !== undefined)  payload.code_url  = updates.codeUrl;
  if (updates.demoUrl !== undefined)  payload.demo_url  = updates.demoUrl;
  if ((updates as any).description !== undefined) payload.description = (updates as any).description;
  if ((updates as any).notes !== undefined)       payload.notes       = (updates as any).notes;
  if ((updates as any).status !== undefined)      payload.status      = (updates as any).status;

  if (Object.keys(payload).length > 0) {
    await ctmClient.patch(`/submissions/${submissionId}`, payload);
  }
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: string,
): Promise<void> {
  if (USE_MOCK) { await mockApi.updateSubmissionStatus(submissionId, status as any); return; }
  await ctmClient.patch(`/submissions/${submissionId}/status`, { status });
}

// ── Evaluation writes ─────────────────────────────────────────────────────────

export async function createEvaluation(data: Partial<Evaluation> & {
  submissionId: string;
  score: number;
  feedback?: string;
  criteriaScores?: Record<string, number>;
  evaluatedBy?: string;
}): Promise<{ data: Evaluation | null }> {
  if (USE_MOCK) return mockApi.createEvaluation(data as any);

  try {
    const payload = {
      submission_id: data.submissionId,
      score: data.score,
      feedback: data.feedback,
      criteria: data.criteriaScores ?? {},
      is_final: true,
    };
    const created = await ctmClient.post<any>('/evaluations', payload);
    return {
      data: {
        id: created.id,
        submissionId: created.submission_id,
        score: created.score,
        feedback: created.feedback ?? '',
        evaluatedBy: String(created.evaluator_id ?? data.evaluatedBy ?? ''),
        evaluatedAt: created.created_at ?? new Date().toISOString(),
        criteriaScores: created.criteria ?? {},
      },
    };
  } catch (err: any) {
    throw new Error(err.message ?? 'Failed to create evaluation');
  }
}

// ── Subscription writes ───────────────────────────────────────────────────────

export async function createSubscription(data: {
  companyId: string;
  planId: string;
  billingCycle?: string;
}): Promise<{ data: any }> {
  if (USE_MOCK) return mockApi.createSubscription(data as any);

  try {
    const created = await ctmClient.post<any>('/subscriptions', {
      company_id: data.companyId,
      plan_id: data.planId,
      billing_cycle: data.billingCycle ?? 'annual',
    });
    return { data: created?.data ?? created };
  } catch (err: any) {
    throw new Error(err.message ?? 'Failed to create subscription');
  }
}

export async function updateSubscription(
  subscriptionId: string,
  updates: { status?: string; planId?: string; billingCycle?: string },
): Promise<{ data: any }> {
  if (USE_MOCK) return mockApi.updateSubscription(subscriptionId, updates as any);

  try {
    const payload: Record<string, unknown> = {};
    if (updates.status !== undefined)      payload.status       = updates.status;
    if (updates.planId !== undefined)      payload.plan_id      = updates.planId;
    if (updates.billingCycle !== undefined) payload.billing_cycle = updates.billingCycle;
    const updated = await ctmClient.patch<any>(`/subscriptions/${subscriptionId}`, payload);
    return { data: updated?.data ?? updated };
  } catch (err: any) {
    throw new Error(err.message ?? 'Failed to update subscription');
  }
}

// ── Company writes ────────────────────────────────────────────────────────────

export async function createCompany(data: {
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  tier?: string;
}): Promise<{ data: any }> {
  if (USE_MOCK) return mockApi.createCompany(data as any);

  try {
    const payload = {
      name: data.name,
      description: data.description,
      website: data.website,
      logo_url: data.logoUrl,
      tier: data.tier ?? 'free',
    };
    const created = await ctmClient.post<any>('/companies', payload);
    return { data: created };
  } catch (err: any) {
    throw new Error(err.message ?? 'Failed to create company');
  }
}
