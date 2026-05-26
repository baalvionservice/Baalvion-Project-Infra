/**
 * @fileOverview Mock Audit Implementation
 */

import { AuditLog } from "@/types/audit";

const STORAGE_KEY = "law_elite_audit_logs";

export const mockLogAction = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const newLog = {
    id: `log_${Date.now()}`,
    logId: `log_${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newLog, ...existing]));
  return newLog.id;
};

export const mockGetAuditLogs = async (filters: any = {}) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  
  let filtered = [...all];
  if (filters.userId) filtered = filtered.filter(l => l.userId === filters.userId);
  if (filters.action) filtered = filtered.filter(l => l.action === filters.action);
  
  return filtered;
};
