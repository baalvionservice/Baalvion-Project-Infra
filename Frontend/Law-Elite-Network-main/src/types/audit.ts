/**
 * @fileOverview Core Audit Type definitions for the Law Elite Network.
 */

export type AuditAction = 
  | "create_case" 
  | "update_case" 
  | "delete_case" 
  | "book_appointment" 
  | "send_message" 
  | "upload_document"
  | "user_login"
  | "status_change";

export type AuditEntityType = "case" | "appointment" | "document" | "user" | "system";

export interface AuditLog {
  id?: string;
  logId?: string;
  userId: string;
  userRole: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  details?: any;
  createdAt: any;
}
