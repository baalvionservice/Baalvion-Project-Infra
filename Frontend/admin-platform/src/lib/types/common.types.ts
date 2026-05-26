export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export type Status = 'active' | 'inactive' | 'suspended' | 'pending' | 'draft' | 'published' | 'archived';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
  roles?: string[];
  permissions?: string[];
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: number | string;
}

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type ResourceType =
  | 'users'
  | 'organizations'
  | 'cms'
  | 'media'
  | 'analytics'
  | 'payments'
  | 'audit_logs'
  | 'feature_flags'
  | 'notifications'
  | 'settings';
