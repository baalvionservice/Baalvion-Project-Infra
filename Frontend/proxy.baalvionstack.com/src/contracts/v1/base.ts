/**
 * Base Contracts v1
 * Core types and utilities for all contracts
 * 
 * STATE OWNERSHIP: Shared across all state layers
 */

// ============================================
// IDENTIFIER TYPES
// ============================================

export type UUID = string;
export type Timestamp = string; // ISO 8601 format
export type Email = string;
export type URL = string;

// ============================================
// BASE ENTITY
// ============================================

export interface BaseEntity {
  id: UUID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// PAGINATION
// ============================================

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================
// API RESPONSE WRAPPER
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Timestamp;
  requestId?: string;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: Timestamp;
  latency: number;
  version: string;
}

// ============================================
// STATUS ENUMS
// ============================================

export type EntityStatus = "active" | "inactive" | "pending" | "deleted";
export type HealthStatus = "healthy" | "degraded" | "critical" | "down";
export type SeverityLevel = "low" | "medium" | "high" | "critical";

// ============================================
// AUDIT TRAIL
// ============================================

export interface AuditMeta {
  createdBy: UUID;
  updatedBy?: UUID;
  deletedBy?: UUID;
  deletedAt?: Timestamp;
}

// ============================================
// MULTI-TENANCY
// ============================================

export interface TenantScoped {
  orgId: UUID;
}

export interface WorkspaceScoped extends TenantScoped {
  workspaceId: UUID;
}

// ============================================
// VERSIONING
// ============================================

export const CONTRACT_VERSION = "v1";

export interface Versioned {
  _version: string;
}
