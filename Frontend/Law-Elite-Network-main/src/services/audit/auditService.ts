/**
 * @fileOverview Audit Service — LIVE-safe. No Firebase, no mock.
 * The platform audit trail is written server-side (law-service legal.audit_logs) and read
 * by admins via the admin console (/admin/audit). These client hooks are no-ops.
 */
import { AuditAction, AuditEntityType } from '@/types/audit';

export const logAction = async (_params: {
  userId: string; userRole: string; action: AuditAction; entityType: AuditEntityType; entityId: string; details?: any;
}) => ({ success: true });

export const getAuditLogs = async (_filters: any = {}, _pageSize = 50): Promise<any[]> => [];
