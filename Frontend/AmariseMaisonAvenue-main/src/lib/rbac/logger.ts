/**
 * @fileOverview Simple logging system for RBAC events.
 */

export interface RBACLog {
  timestamp: string;
  userId: string;
  action: string;
  permission: string;
  granted: boolean;
  resourceCountry?: string;
}

const logs: RBACLog[] = [];

export function logAccess(userId: string, permission: string, granted: boolean, resourceCountry?: string) {
  const log: RBACLog = {
    timestamp: new Date().toISOString(),
    userId,
    action: granted ? "ACCESS_GRANTED" : "ACCESS_DENIED",
    permission,
    granted,
    resourceCountry,
  };
  
  logs.unshift(log);
  
  if (logs.length > 100) logs.pop();
  
  if (!granted) {
    console.warn(`[RBAC Security] Access Denied for user ${userId} on permission ${permission}`);
  }
}

export function getAccessLogs() {
  return logs;
}
