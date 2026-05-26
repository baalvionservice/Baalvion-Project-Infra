/**
 * Observability Layer
 * 
 * Centralized logging, error capture, and event tracking.
 * Frontend-only, structured for future backend integration.
 */

import { UUID, Timestamp } from "@/contracts/v1/base";
import { AppError } from "@/contracts/v1/errors";
import { SystemEventType } from "@/contracts/v1/events";

// ============================================
// LOG LEVELS
// ============================================

export type LogLevel = "debug" | "info" | "warn" | "error";

// ============================================
// STRUCTURED LOG
// ============================================

export interface StructuredLog {
  level: LogLevel;
  message: string;
  timestamp: Timestamp;
  context: LogContext;
  data?: Record<string, unknown>;
  error?: { code: string; message: string; stack?: string };
}

export interface LogContext {
  userId?: UUID;
  orgId?: UUID;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
}

// ============================================
// LOGGER
// ============================================

let globalContext: LogContext = {};

export const logger = {
  setContext(ctx: Partial<LogContext>) {
    globalContext = { ...globalContext, ...ctx };
  },
  
  clearContext() {
    globalContext = {};
  },
  
  log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry: StructuredLog = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: globalContext,
      data,
    };
    
    // In production, this would send to a logging service
    if (level === "error") {
      console.error(`[${level.toUpperCase()}]`, message, entry);
    } else if (level === "warn") {
      console.warn(`[${level.toUpperCase()}]`, message, entry);
    } else {
      console.log(`[${level.toUpperCase()}]`, message, entry);
    }
  },
  
  debug: (msg: string, data?: Record<string, unknown>) => logger.log("debug", msg, data),
  info: (msg: string, data?: Record<string, unknown>) => logger.log("info", msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => logger.log("warn", msg, data),
  error: (msg: string, data?: Record<string, unknown>) => logger.log("error", msg, data),
};

// ============================================
// ERROR CAPTURE
// ============================================

export function captureError(error: AppError | Error, context?: Record<string, unknown>) {
  const entry = {
    code: "code" in error ? error.code : "UNKNOWN",
    message: error.message,
    stack: "stack" in error ? (error as Error).stack : undefined,
    context: { ...globalContext, ...context },
    timestamp: new Date().toISOString(),
  };
  
  console.error("[ERROR CAPTURED]", entry);
  // In production: send to error tracking service (Sentry, etc.)
}

// ============================================
// EVENT TRACKING
// ============================================

export function trackEvent(type: SystemEventType, payload?: Record<string, unknown>) {
  const event = {
    type,
    payload,
    context: globalContext,
    timestamp: new Date().toISOString(),
  };
  
  console.log("[EVENT]", event);
  // In production: send to analytics service
}

// ============================================
// PERFORMANCE TRACKING
// ============================================

export function trackTiming(name: string, duration: number, tags?: Record<string, string>) {
  console.log("[TIMING]", { name, duration, tags, timestamp: new Date().toISOString() });
}

export function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  return fn().finally(() => {
    trackTiming(name, performance.now() - start);
  });
}
