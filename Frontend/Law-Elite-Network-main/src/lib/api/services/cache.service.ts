
"use client";

/**
 * @fileOverview CacheService
 * Provides a high-performance in-memory caching layer with TTL support.
 */

interface CacheEntry {
  data: any;
  expiry: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTtl: number = 1000 * 60 * 5; // 5 minutes default

  /**
   * Retrieves data from cache if it exists and hasn't expired.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stores data in cache with a specific TTL.
   */
  set(key: string, data: any, ttlOverride?: number): void {
    const ttl = ttlOverride || this.defaultTtl;
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  /**
   * Removes a specific key from the cache.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Purges all keys matching a specific prefix.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Full cache purge.
   */
  clear(): void {
    this.cache.clear();
  }
}
