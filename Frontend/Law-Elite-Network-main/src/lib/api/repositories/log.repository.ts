
"use client";

export type LogLevel = 'info' | 'warning' | 'error';

export interface SystemLog {
  logId?: string;
  level: LogLevel;
  message: string;
  context: any;
  userId?: string;
  createdAt?: any;
}

/**
 * @fileOverview LogRepository
 * Stub implementation — logging is handled server-side by the law-service.
 */
export class LogRepository {
  constructor() {}

  async create(log: SystemLog) {
    // No-op: server-side logging only
    const payload = {
      ...log,
      logId: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    return payload;
  }

  async findLogs(_params: { level?: LogLevel; userId?: string; max?: number } = {}) {
    return [];
  }
}
