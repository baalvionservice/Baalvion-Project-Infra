'use client';

/**
 * @fileOverview REST Audit Implementation
 * Replaces the previous Firebase/Firestore implementation.
 */

import { apiClient } from '@/lib/api/client';
import { AuditLog, AuditAction } from '@/types/audit';

export const firebaseLogAction = async (data: Omit<AuditLog, 'createdAt' | 'logId'>): Promise<string | null> => {
  try {
    const res = await apiClient.post('/admin/audit', data);
    return res.data?.data?.logId ?? null;
  } catch (error) {
    console.error('Audit logging failure:', error);
    return null;
  }
};

export interface AuditFilters {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
}

export const firebaseGetAuditLogs = async (filters: AuditFilters = {}, pageSize = 50) => {
  try {
    const params: Record<string, any> = { limit: pageSize };
    if (filters.userId) params.userId = filters.userId;
    if (filters.action) params.action = filters.action;
    if (filters.entityType) params.entityType = filters.entityType;

    const res = await apiClient.get('/admin/audit', { params });
    return res.data?.data ?? [];
  } catch (error) {
    console.error('Audit retrieval failure:', error);
    return [];
  }
};
