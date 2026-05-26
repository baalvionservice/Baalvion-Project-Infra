export interface ApiUsageStat {
  date:        string;
  endpoint:    string;
  method:      string;
  calls:       number;
  errors:      number;
  p50Ms:       number;
  p95Ms:       number;
  p99Ms:       number;
}

export interface WebhookEndpoint {
  id:          string;
  url:         string;
  description: string;
  events:      string[];
  secret:      string;
  enabled:     boolean;
  orgId:       string | null;
  successRate: number;
  lastTriggeredAt: string | null;
  createdAt:   string;
}

export interface WebhookDelivery {
  id:           string;
  endpointId:   string;
  eventType:    string;
  payload:      Record<string, unknown>;
  statusCode:   number | null;
  responseBody: string | null;
  latencyMs:    number | null;
  attempts:     number;
  nextRetryAt:  string | null;
  status:       'pending' | 'success' | 'failed' | 'retrying';
  createdAt:    string;
}

export interface RateLimitPolicy {
  id:          string;
  name:        string;
  scope:       'global' | 'org' | 'user' | 'api_key';
  windowSec:   number;
  maxRequests: number;
  burstLimit:  number;
  enabled:     boolean;
}

export interface ChangelogEntry {
  id:          string;
  version:     string;
  title:       string;
  body:        string;
  type:        'feature' | 'fix' | 'breaking' | 'deprecation' | 'security';
  publishedAt: string | null;
  createdAt:   string;
}

export interface SdkRelease {
  id:          string;
  language:    'typescript' | 'python' | 'go' | 'ruby' | 'java' | 'php';
  version:     string;
  downloadUrl: string;
  changelog:   string;
  publishedAt: string;
}

export interface ApiEndpointStat {
  endpoint:    string;
  method:      'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  callsToday:  number;
  errorsToday: number;
  p95Ms:       number;
  trend:       'up' | 'down' | 'stable';
}

export interface SandboxEnvironment {
  id:          string;
  name:        string;
  orgId:       string | null;
  status:      'running' | 'stopped' | 'creating';
  baseUrl:     string;
  resetUrl:    string;
  expiresAt:   string | null;
  createdAt:   string;
}
