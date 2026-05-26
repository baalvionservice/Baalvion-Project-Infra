/**
 * @fileOverview Production-Grade Institutional Logging Service
 * Provides full traceability for API, Security, AI, and Admin actions.
 */

import { SystemLog, AuditLogEntry, AIActionLog, MaisonError } from "../types";

class LoggingService {
  private static instance: LoggingService;
  private logs: SystemLog[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private aiLogs: AIActionLog[] = [];
  private errors: MaisonError[] = [];

  private constructor() {}

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Capture a generic system/API event
   */
  public log(params: Omit<SystemLog, "id" | "timestamp">) {
    const entry: SystemLog = {
      ...params,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.unshift(entry);
    if (this.logs.length > 5000) this.logs.pop();

    // Console visibility for developers
    const color =
      entry.status === "success" ? "color: #10b981" : "color: #ef4444";
    console.log(
      `%c[SYSTEM LOG] %c${entry.type?.toUpperCase() || "SYSTEM"} | ${
        entry.action
      }`,
      "color: #7E3F98; font-weight: bold;",
      color,
      entry
    );

    return entry.id;
  }

  /**
   * Capture a critical Admin audit event with state deltas
   */
  public audit(params: Omit<AuditLogEntry, "id" | "timestamp">) {
    const entry: AuditLogEntry = {
      ...params,
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    console.log(
      `%c[AUDIT] ⚖️  ${entry.actorName} (${entry.actorRole}) performed ${entry.action} on ${entry.entity}`,
      "color: #D4AF37; font-weight: bold;",
      entry
    );
    return entry.id;
  }

  /**
   * Capture AI neural traces and decision logic
   */
  public ai(params: Omit<AIActionLog, "id" | "timestamp">) {
    const entry: AIActionLog = {
      ...params,
      id: `ail_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    this.aiLogs.unshift(entry);
    console.log(
      `%c[AI TRACE] 🧠 Module: ${entry.moduleId} | Confidence: ${
        entry.confidence || "N/A"
      }`,
      "color: #3B82F6; font-weight: bold;",
      entry
    );
    return entry.id;
  }

  /**
   * Standardized Error Capturing
   */
  public error(params: Omit<MaisonError, "id" | "timestamp" | "resolved">) {
    const entry: MaisonError = {
      ...params,
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
    };
    this.errors.unshift(entry);
    console.error(
      `%c[ANOMALY] 🚨 ${entry.type} in ${entry.module}: ${entry.message}`,
      "color: #ef4444; font-weight: bold;",
      entry
    );
    return entry.id;
  }

  public getRegistry() {
    return {
      system: this.logs,
      audit: this.auditLogs,
      ai: this.aiLogs,
      errors: this.errors,
    };
  }
}

export const logger = LoggingService.getInstance();
