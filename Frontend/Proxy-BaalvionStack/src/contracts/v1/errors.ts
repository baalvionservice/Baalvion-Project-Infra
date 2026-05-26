/**
 * Error Contracts v1
 * Centralized error taxonomy and failure states
 * 
 * STATE OWNERSHIP: UIState for error display
 */

import { Timestamp } from "./base";

// ============================================
// ERROR CODES
// ============================================

export type ErrorCode =
  // Authentication errors (1xxx)
  | "AUTH_001"    // Invalid credentials
  | "AUTH_002"    // Session expired
  | "AUTH_003"    // MFA required
  | "AUTH_004"    // Account locked
  | "AUTH_005"    // Account suspended
  | "AUTH_006"    // Email not verified
  // Permission errors (2xxx)
  | "PERM_001"    // Insufficient permissions
  | "PERM_002"    // Resource access denied
  | "PERM_003"    // Organization access denied
  | "PERM_004"    // Feature not available in plan
  | "PERM_005"    // Role not allowed
  // Validation errors (3xxx)
  | "VAL_001"     // Invalid input
  | "VAL_002"     // Missing required field
  | "VAL_003"     // Invalid format
  | "VAL_004"     // Value out of range
  | "VAL_005"     // Duplicate entry
  // Rate limit errors (4xxx)
  | "RATE_001"    // Rate limit exceeded
  | "RATE_002"    // Burst limit exceeded
  | "RATE_003"    // Quota exceeded
  | "RATE_004"    // Concurrent limit exceeded
  // Resource errors (5xxx)
  | "RES_001"     // Resource not found
  | "RES_002"     // Resource already exists
  | "RES_003"     // Resource deleted
  | "RES_004"     // Resource unavailable
  // Server errors (6xxx)
  | "SRV_001"     // Internal server error
  | "SRV_002"     // Service unavailable
  | "SRV_003"     // Database error
  | "SRV_004"     // External service error
  // Network errors (7xxx)
  | "NET_001"     // Network timeout
  | "NET_002"     // Connection refused
  | "NET_003"     // DNS resolution failed
  | "NET_004"     // SSL/TLS error
  // Billing errors (8xxx)
  | "BILL_001"    // Payment failed
  | "BILL_002"    // Card declined
  | "BILL_003"    // Subscription expired
  | "BILL_004"    // Usage limit exceeded;

// ============================================
// ERROR CATEGORIES
// ============================================

export type ErrorCategory =
  | "auth"
  | "permission"
  | "validation"
  | "rate_limit"
  | "resource"
  | "server"
  | "network"
  | "billing";

// ============================================
// BASE ERROR
// ============================================

export interface AppError {
  code: ErrorCode;
  category: ErrorCategory;
  message: string;
  userMessage: string;
  details?: ErrorDetails;
  timestamp: Timestamp;
  requestId?: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}

export interface ErrorDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
  suggestion?: string;
  documentation?: string;
}

// ============================================
// SPECIFIC ERROR TYPES
// ============================================

export interface AuthError extends AppError {
  category: "auth";
  redirectUrl?: string;
  mfaRequired?: boolean;
}

export interface PermissionError extends AppError {
  category: "permission";
  requiredPermission?: string;
  requiredPlan?: string;
  upgradeUrl?: string;
}

export interface ValidationError extends AppError {
  category: "validation";
  fieldErrors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface RateLimitError extends AppError {
  category: "rate_limit";
  limit: number;
  remaining: number;
  resetAt: Timestamp;
}

export interface ServerError extends AppError {
  category: "server";
  stack?: string; // Only in development
}

export interface NetworkError extends AppError {
  category: "network";
  url?: string;
  method?: string;
  timeout?: number;
}

export interface BillingError extends AppError {
  category: "billing";
  billingPortalUrl?: string;
}

// ============================================
// ERROR FACTORY
// ============================================

export function createError(
  code: ErrorCode,
  message: string,
  details?: Partial<AppError>
): AppError {
  const category = getErrorCategory(code);
  return {
    code,
    category,
    message,
    userMessage: getUserMessage(code, message),
    timestamp: new Date().toISOString(),
    retryable: isRetryable(code),
    ...details,
  };
}

function getErrorCategory(code: ErrorCode): ErrorCategory {
  const prefix = code.split("_")[0];
  const categoryMap: Record<string, ErrorCategory> = {
    AUTH: "auth",
    PERM: "permission",
    VAL: "validation",
    RATE: "rate_limit",
    RES: "resource",
    SRV: "server",
    NET: "network",
    BILL: "billing",
  };
  return categoryMap[prefix] || "server";
}

function getUserMessage(code: ErrorCode, defaultMessage: string): string {
  const messages: Partial<Record<ErrorCode, string>> = {
    AUTH_001: "Invalid email or password. Please try again.",
    AUTH_002: "Your session has expired. Please log in again.",
    AUTH_003: "Please complete two-factor authentication.",
    AUTH_004: "Your account has been locked. Please contact support.",
    AUTH_005: "Your account has been suspended. Please contact support.",
    PERM_001: "You don't have permission to perform this action.",
    PERM_004: "This feature is not available on your current plan.",
    RATE_001: "You've made too many requests. Please wait and try again.",
    RATE_003: "You've exceeded your usage quota.",
    NET_001: "Request timed out. Please check your connection.",
    SRV_001: "Something went wrong. Please try again later.",
  };
  return messages[code] || defaultMessage;
}

function isRetryable(code: ErrorCode): boolean {
  const retryableCodes: ErrorCode[] = [
    "RATE_001", "RATE_002",
    "NET_001", "NET_002",
    "SRV_002", "SRV_004",
  ];
  return retryableCodes.includes(code);
}

// ============================================
// ERROR STATE FOR UI
// ============================================

export interface ErrorState {
  hasError: boolean;
  error: AppError | null;
  isRecoverable: boolean;
  retryCount: number;
  maxRetries: number;
}

export const initialErrorState: ErrorState = {
  hasError: false,
  error: null,
  isRecoverable: true,
  retryCount: 0,
  maxRetries: 3,
};

// ============================================
// UI ERROR DISPLAY
// ============================================

export interface ErrorDisplay {
  title: string;
  message: string;
  icon: "alert" | "warning" | "error" | "info";
  actions: ErrorAction[];
}

export interface ErrorAction {
  label: string;
  type: "retry" | "dismiss" | "navigate" | "contact";
  href?: string;
}

export function getErrorDisplay(error: AppError): ErrorDisplay {
  const categoryConfig: Record<ErrorCategory, Partial<ErrorDisplay>> = {
    auth: {
      title: "Authentication Error",
      icon: "warning",
      actions: [{ label: "Log in again", type: "navigate", href: "/login" }],
    },
    permission: {
      title: "Access Denied",
      icon: "alert",
      actions: [{ label: "Upgrade Plan", type: "navigate", href: "/billing" }],
    },
    validation: {
      title: "Invalid Input",
      icon: "info",
      actions: [{ label: "Dismiss", type: "dismiss" }],
    },
    rate_limit: {
      title: "Rate Limited",
      icon: "warning",
      actions: [{ label: "Retry", type: "retry" }],
    },
    resource: {
      title: "Not Found",
      icon: "info",
      actions: [{ label: "Go Back", type: "navigate", href: "/" }],
    },
    server: {
      title: "Server Error",
      icon: "error",
      actions: [
        { label: "Retry", type: "retry" },
        { label: "Contact Support", type: "contact" },
      ],
    },
    network: {
      title: "Network Error",
      icon: "warning",
      actions: [{ label: "Retry", type: "retry" }],
    },
    billing: {
      title: "Billing Issue",
      icon: "warning",
      actions: [{ label: "Update Payment", type: "navigate", href: "/billing" }],
    },
  };

  const config = categoryConfig[error.category];
  return {
    title: config.title || "Error",
    message: error.userMessage,
    icon: config.icon || "error",
    actions: config.actions || [{ label: "Dismiss", type: "dismiss" }],
  };
}
