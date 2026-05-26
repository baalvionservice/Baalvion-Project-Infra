import { AuditLogEntry, UserRole, ModuleName, ActionType } from "../content/schemas";

let auditLogs: AuditLogEntry[] = [];

export const auditService = {
  log: async (params: {
    userRole: UserRole;
    module: ModuleName;
    action: ActionType;
    entityId: string;
    previousState?: any;
    newState?: any;
  }): Promise<void> => {
    // Mock latency
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const entry: AuditLogEntry = {
      id: `LOG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      ...params
    };

    auditLogs = [entry, ...auditLogs];
    window.dispatchEvent(new CustomEvent('audit-updated', { detail: entry }));
    console.log(`[Audit] ${params.action} on ${params.module} (${params.entityId})`);
  },

  getLogs: async (filters?: { 
    role?: UserRole; 
    module?: ModuleName;
    limit?: number;
  }): Promise<AuditLogEntry[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    let filtered = [...auditLogs];
    if (filters?.role) filtered = filtered.filter(l => l.userRole === filters.role);
    if (filters?.module) filtered = filtered.filter(l => l.module === filters.module);
    if (filters?.limit) filtered = filtered.slice(0, filters.limit);
    return filtered;
  },

  exportLogs: async (): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return JSON.stringify(auditLogs, null, 2);
  }
};
