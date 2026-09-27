/**
 * @fileOverview API response and network related types.
 */

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Canonical response envelope. `data` is the only guaranteed field. Two conventions coexist
 * across the codebase and both satisfy this shape:
 *   - lightweight (services / mock-api / data layer):  { data, status?, error? }
 *   - full gateway envelope (api-client / backends):   { success, statusCode, message, timestamp }
 * Keeping the extra fields optional unifies them under one type without rewriting call sites.
 */
export interface ApiResponse<T> {
  data: T;
  // lightweight convention
  status?: number;
  error?: string;
  // full envelope convention
  success?: boolean;
  statusCode?: number;
  message?: string;
  timestamp?: string;
  path?: string; // Only present in error responses
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}
