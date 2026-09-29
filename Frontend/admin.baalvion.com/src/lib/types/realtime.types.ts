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

export interface LiveEvent {
  id:          string;
  type:        'auth' | 'security' | 'payment' | 'system' | 'user' | 'admin' | 'oauth';
  action:      string;
  severity:    'info' | 'warning' | 'error' | 'critical';
  userId?:     string;
  userEmail?:  string;
  ip?:         string;
  orgId?:      string;
  country?:    string;
  timestamp:   string;
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
