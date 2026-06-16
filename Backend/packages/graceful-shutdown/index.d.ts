import type * as http from 'http';

export interface ShutdownOptions {
  /** Maximum ms to wait for in-flight requests to drain. Default: 10_000 */
  timeout?: number;
  /**
   * Hard deadline (ms) from signal receipt after which the process force-exits
   * with code 1 regardless of handler state. Default: `timeout + 5_000`.
   */
  forceExitTimeout?: number;
}

/**
 * Register a named async cleanup function, run (in parallel) after the HTTP
 * server has drained during graceful shutdown.
 */
export function registerShutdown(name: string, fn: () => Promise<void>): void;

/**
 * Attach SIGTERM / SIGINT handlers that drain the HTTP server, run the registered
 * cleanup handlers, then exit. A watchdog force-exits at `forceExitTimeout`.
 */
export function initGracefulShutdown(server: http.Server, options?: ShutdownOptions): void;
