'use client';

import { ENV_CONFIG } from "@/config/environment";
import { ApiResponse, ErrorCode } from "@/types/api.types";

/**
 * Production-Hardened Storage Adapter
 * Handles persistence with strict SSR safety and non-deterministic logic isolation.
 */
export class StorageAdapter {
  private readonly key: string;

  constructor(domain: string) {
    this.key = `${ENV_CONFIG.storageKey}_${domain}`;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private generateRequestId(): string {
    return `req_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async simulateNetwork(): Promise<void> {
    if (!this.isBrowser()) return;

    if (ENV_CONFIG.enableMockLatency) {
      await new Promise(resolve => setTimeout(resolve, ENV_CONFIG.mockLatencyMs));
    }

    if (ENV_CONFIG.enableFailureSimulation) {
      // Logic is client-only to prevent SSR hydration mismatches
      if (Math.random() < ENV_CONFIG.failureRate) {
        throw new Error("MOCK_NETWORK_TIMEOUT");
      }
    }
  }

  private wrapResponse<T>(data: T | undefined, success: boolean = true, error?: { code: ErrorCode; message: string }): ApiResponse<T> {
    return {
      success,
      data,
      error,
      meta: {
        timestamp: Date.now(),
        requestId: this.generateRequestId(),
        environment: ENV_CONFIG.mode
      }
    };
  }

  async getAll<T>(): Promise<ApiResponse<T[]>> {
    try {
      if (!this.isBrowser()) return this.wrapResponse([]);

      await this.simulateNetwork();
      
      const raw = localStorage.getItem(this.key);
      const data = raw ? JSON.parse(raw) : [];
      
      return this.wrapResponse(data);
    } catch (e: any) {
      return this.wrapResponse([], false, { 
        code: 'NETWORK_ERROR', 
        message: e.message === "MOCK_NETWORK_TIMEOUT" ? "Connection timed out. Please retry." : "Storage access error." 
      });
    }
  }

  async saveAll<T>(data: T[]): Promise<ApiResponse<boolean>> {
    try {
      if (!this.isBrowser()) return this.wrapResponse(false);
      
      await this.simulateNetwork();
      localStorage.setItem(this.key, JSON.stringify(data));
      return this.wrapResponse(true);
    } catch (e: any) {
      return this.wrapResponse(false, false, { code: 'UNKNOWN_ERROR', message: "Failed to persist data." });
    }
  }

  async initialize<T>(defaultData: T[]): Promise<void> {
    if (!this.isBrowser()) return;
    
    const existing = localStorage.getItem(this.key);
    if (!existing || existing === '[]') {
      localStorage.setItem(this.key, JSON.stringify(defaultData));
    }
  }
}
