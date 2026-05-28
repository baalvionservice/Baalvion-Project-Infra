import * as http from 'http';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShutdownOptions {
  /** Maximum ms to wait for in-flight requests to drain. Default: 10_000 */
  timeout?: number;
}

type ShutdownHandler = () => Promise<void>;

interface RegisteredHandler {
  name: string;
  fn: ShutdownHandler;
}

// ---------------------------------------------------------------------------
// Internal registry
// ---------------------------------------------------------------------------

const handlers: RegisteredHandler[] = [];
let isShuttingDown = false;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * registerShutdown — register a named async cleanup function.
 *
 * Registered handlers are called in parallel during shutdown, after the HTTP
 * server has stopped accepting new connections and in-flight requests have
 * drained (or timed out).
 *
 * @param name  A human-readable label for logging (e.g. 'db', 'redis', 'workers')
 * @param fn    Async cleanup function; must resolve/reject within the shutdown timeout
 *
 * @example
 * registerShutdown('db', () => sequelize.close());
 * registerShutdown('redis', () => redisClient.quit());
 */
export function registerShutdown(name: string, fn: ShutdownHandler): void {
  handlers.push({ name, fn });
}

/**
 * initGracefulShutdown — attach SIGTERM / SIGINT handlers to the HTTP server.
 *
 * On receiving a termination signal the lifecycle is:
 *  1. Stop accepting new connections (server.close)
 *  2. Wait for in-flight requests to complete (up to `timeout` ms)
 *  3. Run all registered shutdown handlers in parallel
 *  4. Exit with code 0
 *
 * @param server   The `http.Server` instance (from `http.createServer` or `app.listen`)
 * @param options  Optional configuration
 */
export function initGracefulShutdown(
  server: http.Server,
  options: ShutdownOptions = {},
): void {
  const timeout = options.timeout ?? 10_000;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      console.log(`[graceful-shutdown] already shutting down — ignoring ${signal}`);
      return;
    }

    isShuttingDown = true;
    console.log(`[graceful-shutdown] ${signal} received — initiating graceful shutdown`);

    // -------------------------------------------------------------------------
    // Step 1: Stop accepting new connections
    // -------------------------------------------------------------------------
    await new Promise<void>((resolve) => {
      console.log('[graceful-shutdown] closing HTTP server (no new connections)...');
      server.close((err) => {
        if (err) {
          console.error('[graceful-shutdown] server.close error:', err);
        } else {
          console.log('[graceful-shutdown] HTTP server closed');
        }
        resolve();
      });

      // -----------------------------------------------------------------------
      // Step 2: Force-close after timeout if requests haven't drained
      // -----------------------------------------------------------------------
      setTimeout(() => {
        console.warn(
          `[graceful-shutdown] drain timeout (${timeout} ms) exceeded — forcing close`,
        );
        resolve();
      }, timeout).unref();
    });

    // -------------------------------------------------------------------------
    // Step 3: Run registered handlers in parallel
    // -------------------------------------------------------------------------
    if (handlers.length > 0) {
      console.log(
        `[graceful-shutdown] running ${handlers.length} registered handler(s): ` +
          handlers.map((h) => h.name).join(', '),
      );

      const results = await Promise.allSettled(
        handlers.map(async ({ name, fn }) => {
          try {
            await fn();
            console.log(`[graceful-shutdown] handler "${name}" completed`);
          } catch (err) {
            console.error(`[graceful-shutdown] handler "${name}" failed:`, err);
            throw err;
          }
        }),
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(
          `[graceful-shutdown] ${failures.length} handler(s) failed — exiting anyway`,
        );
      }
    }

    // -------------------------------------------------------------------------
    // Step 4: Clean exit
    // -------------------------------------------------------------------------
    console.log('[graceful-shutdown] all done — exiting 0');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));
}
