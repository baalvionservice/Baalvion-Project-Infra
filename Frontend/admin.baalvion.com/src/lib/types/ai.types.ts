export type AiProvider = 'anthropic' | 'openai' | 'google' | 'mistral' | 'cohere' | 'local';

export interface AiModel {
  id:           string;
  name:         string;
  provider:     AiProvider;
  modelId:      string;
  type:         'chat' | 'completion' | 'embedding' | 'image' | 'audio';
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kInput:  number;
  costPer1kOutput: number;
  enabled:      boolean;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  callsToday:   number;
  tokensToday:  number;
  errorRate:    number;
  createdAt:    string;
}

export interface Prompt {
  id:          string;
  name:        string;
  slug:        string;
  description: string;
  template:    string;
  variables:   string[];
  modelId:     string;
  version:     number;
  status:      'draft' | 'active' | 'archived';
  tags:        string[];
  createdBy:   string;
  createdAt:   string;
  updatedAt:   string;
}

export interface AiAgent {
  id:           string;
  name:         string;
  description:  string;
  type:         'assistant' | 'workflow' | 'rag' | 'tool_use';
  modelId:      string;
  systemPrompt: string;
  tools:        string[];
  enabled:      boolean;
  callsToday:   number;
  avgLatencyMs: number;
  successRate:  number;
  createdAt:    string;
}

export interface TokenUsageStat {
  date:         string;
  provider:     AiProvider;
  inputTokens:  number;
  outputTokens: number;
  costUsd:      number;
  calls:        number;
  errors:       number;
}

export interface InferenceQueueItem {
  id:          string;
  agentId:     string;
  modelId:     string;
  status:      'queued' | 'processing' | 'completed' | 'failed';
  priority:    number;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs:   number | null;
  error:       string | null;
  createdAt:   string;
  completedAt: string | null;
}

export interface VectorCollection {
  id:           string;
  name:         string;
  description:  string;
  dimensions:   number;
  model:        string;
  documentCount: number;
  sizeBytes:    number;
  createdAt:    string;
}

export interface AiCostSummary {
  totalUsd:      number;
  byProvider:    Record<string, number>;
  byModel:       Record<string, number>;
  trend:         Array<{ date: string; costUsd: number }>;
  forecastUsd:   number;
}
