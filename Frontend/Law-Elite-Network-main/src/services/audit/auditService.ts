/**
 * @fileOverview Audit Service Orchestrator
 * Provides immutable event tracking for the platform.
 */

import * as firebaseService from './audit.firebase';
import * as mockService from './audit.mock';
import { AuditLog, AuditAction, AuditEntityType } from '@/types/audit';

const USE_MOCK = true;

export const logAction = async (params: {
  userId: string;
  userRole: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  details?: any;
}) => {
  if (USE_MOCK) {
    return await mockService.mockLogAction(params);
  }
  return await firebaseService.firebaseLogAction(params);
};

export const getAuditLogs = async (filters: any = {}, pageSize = 50) => {
  if (USE_MOCK) {
    return await mockService.mockGetAuditLogs(filters);
  }
  return await firebaseService.firebaseGetAuditLogs(filters, pageSize);
};
