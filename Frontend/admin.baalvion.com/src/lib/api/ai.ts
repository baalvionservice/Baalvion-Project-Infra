import { adminApiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type {
  AiModel, Prompt, AiAgent, TokenUsageStat,
  InferenceQueueItem, VectorCollection, AiCostSummary,
} from '@/lib/types/ai.types';

export const aiApi = {
  // Models
  listModels: () =>
    adminApiClient.get<ApiResponse<AiModel[]>>('/ai/models'),

  getModel: (id: string) =>
    adminApiClient.get<ApiResponse<AiModel>>(`/ai/models/${id}`),

  updateModel: (id: string, data: Partial<Pick<AiModel, 'enabled' | 'costPer1kInput' | 'costPer1kOutput'>>) =>
    adminApiClient.patch<ApiResponse<AiModel>>(`/ai/models/${id}`, data),

  // Prompts
  listPrompts: (params?: PaginationParams & { status?: string; tag?: string }) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<Prompt>>>('/ai/prompts', { params }),

  getPrompt: (id: string) =>
    adminApiClient.get<ApiResponse<Prompt>>(`/ai/prompts/${id}`),

  createPrompt: (data: Partial<Prompt>) =>
    adminApiClient.post<ApiResponse<Prompt>>('/ai/prompts', data),

  updatePrompt: (id: string, data: Partial<Prompt>) =>
    adminApiClient.patch<ApiResponse<Prompt>>(`/ai/prompts/${id}`, data),

  deletePrompt: (id: string) =>
    adminApiClient.delete<ApiResponse<void>>(`/ai/prompts/${id}`),

  // Agents
  listAgents: (params?: PaginationParams) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<AiAgent>>>('/ai/agents', { params }),

  getAgent: (id: string) =>
    adminApiClient.get<ApiResponse<AiAgent>>(`/ai/agents/${id}`),

  createAgent: (data: Partial<AiAgent>) =>
    adminApiClient.post<ApiResponse<AiAgent>>('/ai/agents', data),

  updateAgent: (id: string, data: Partial<AiAgent>) =>
    adminApiClient.patch<ApiResponse<AiAgent>>(`/ai/agents/${id}`, data),

  toggleAgent: (id: string, enabled: boolean) =>
    adminApiClient.patch<ApiResponse<AiAgent>>(`/ai/agents/${id}`, { enabled }),

  // Usage & Cost
  getTokenUsage: (params: { from: string; to: string; provider?: string }) =>
    adminApiClient.get<ApiResponse<TokenUsageStat[]>>('/ai/usage/tokens', { params }),

  getCostSummary: (period: '7d' | '30d' | '90d') =>
    adminApiClient.get<ApiResponse<AiCostSummary>>('/ai/usage/cost', { params: { period } }),

  // Inference queue
  listInferenceQueue: (params?: PaginationParams & { status?: string }) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<InferenceQueueItem>>>('/ai/queue', { params }),

  retryInference: (id: string) =>
    adminApiClient.post<ApiResponse<void>>(`/ai/queue/${id}/retry`),

  // Vector DB
  listCollections: () =>
    adminApiClient.get<ApiResponse<VectorCollection[]>>('/ai/vectors/collections'),

  getCollection: (id: string) =>
    adminApiClient.get<ApiResponse<VectorCollection>>(`/ai/vectors/collections/${id}`),

  // Sandbox
  testPrompt: (data: { promptId: string; variables: Record<string, string> }) =>
    adminApiClient.post<ApiResponse<{ output: string; tokensUsed: number; latencyMs: number }>>('/ai/sandbox/test', data),
};
