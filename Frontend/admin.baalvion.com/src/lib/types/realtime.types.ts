export interface ServiceStatus {
  name:       string;
  status:     'up' | 'down' | 'degraded';
  latencyMs:  number | null;
  checkedAt:  string;
}

export interface PlatformStats {
  activeUsers:     number;
  activeSessions:  number;
  logins24h:       number;
  failedLogins24h: number;
  orgs:            number;
}

export type LiveEventType =
  | 'auth'
  | 'security'
  | 'payment'
  | 'system'
  | 'user'
  | 'admin'
  | 'oauth'
  | 'order'
  | 'support'
  | 'marketplace'
  | 'message'
  | 'community'
  | 'job'
  | 'brand'
  | 'cms';

export interface LiveEvent {
  id:          string;
  type:        LiveEventType;
  action:      string;
  severity:    'info' | 'warning' | 'error' | 'critical';
  userId?:     string;
  userEmail?:  string;
  userName?:   string;
  ip?:         string;
  orgId?:      string;
  country?:    string;
  timestamp:   string;
  /** Human-readable summary for the notification bell */
  summary?:    string;
  /** Deep-link to the relevant admin page */
  href?:       string;
  meta?:       Record<string, unknown>;
}

export interface QueueStat {
  name:        string;
  displayName: string;
  waiting:     number;
  active:      number;
  completed:   number;
  failed:      number;
  delayed:     number;
}

export interface InfraMetrics {
  cpu:     number;
  memory:  number;
  disk:    number;
  network: { inKbps: number; outKbps: number };
  redis: {
    keyCount:   number;
    hitRate:    number;
    memoryMb:   number;
    connectedClients: number;
  };
  postgres: {
    connections:    number;
    maxConnections: number;
    activeQueries:  number;
    replicationLag: number;
  };
}

export interface TimeSeriesPoint {
  time:   string;
  value:  number;
  value2?: number;
}

export type WsConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';
