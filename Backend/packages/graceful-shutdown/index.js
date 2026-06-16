'use strict';
// @baalvion/graceful-shutdown — committed plain CommonJS (NO build step).
//
// Runtime entry is this committed file (not a gitignored tsup dist/), so it always
// resolves in production images built via `turbo prune` + `pnpm deploy --prod`,
// which do NOT run a package build. Mirrors the proven @baalvion/auth-node pattern.

/** @typedef {() => Promise<void>} ShutdownHandler */

/** @type {{ name: string, fn: ShutdownHandler }[]} */
const handlers = [];
let isShuttingDown = false;

/**
 * registerShutdown — register a named async cleanup function.
 *
 * Handlers run in parallel during shutdown, after the HTTP server has stopped
 * accepting new connections and in-flight requests have drained (or timed out).
 * Each handler is wrapped in try/catch — a failing handler cannot block the others.
 *
 * @param {string} name  Human-readable label for logging (e.g. 'db', 'redis', 'queues')
 * @param {ShutdownHandler} fn  Async cleanup function
 */
function registerShutdown(name, fn) {
  handlers.push({ name, fn });
}

/**
 * initGracefulShutdown — attach SIGTERM / SIGINT handlers to the HTTP server.
 *
 * Lifecycle on a termination signal:
 *  1. Stop accepting new connections (server.close)
 *  2. Wait for in-flight requests to drain (up to `timeout` ms)
 *  3. Run all registered shutdown handlers in parallel
 *  4. Exit 0
 * A watchdog force-exits (code 1) at `forceExitTimeout` so the container always
 * terminates inside the orchestrator's grace period even if a handler hangs.
 *
 * @param {import('http').Server} server
 * @param {{ timeout?: number, forceExitTimeout?: number }} [options]
 */
function initGracefulShutdown(server, options = {}) {
  const timeout = options.timeout != null ? options.timeout : 10000;
  const forceExitTimeout = options.forceExitTimeout != null ? options.forceExitTimeout : timeout + 5000;

  const shutdown = async (signal) => {
    if (isShuttingDown) {
      console.log(`[graceful-shutdown] already shutting down — ignoring ${signal}`);
      return;
    }
    isShuttingDown = true;
    console.log(`[graceful-shutdown] ${signal} received — initiating graceful shutdown`);

    // Watchdog: hard deadline. If the graceful path hangs (e.g. a DB/Redis handler
    // never resolves) force-exit so the pod cannot get stuck Terminating.
    const watchdog = setTimeout(() => {
      console.error(`[graceful-shutdown] force-exit deadline (${forceExitTimeout} ms) reached — exiting 1`);
      process.exit(1);
    }, forceExitTimeout);
    watchdog.unref();

    // Step 1+2: stop new connections, wait for in-flight to drain (or force after timeout).
    await new Promise((resolve) => {
      console.log('[graceful-shutdown] closing HTTP server (no new connections)...');
      server.close((err) => {
        if (err) console.error('[graceful-shutdown] server.close error:', err);
        else console.log('[graceful-shutdown] HTTP server closed');
        resolve();
      });
      setTimeout(() => {
        console.warn(`[graceful-shutdown] drain timeout (${timeout} ms) exceeded — forcing close`);
        resolve();
      }, timeout).unref();
    });

    // Step 3: run registered handlers in parallel.
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
        console.warn(`[graceful-shutdown] ${failures.length} handler(s) failed — exiting anyway`);
      }
    }

    // Step 4: clean exit.
    clearTimeout(watchdog);
    console.log('[graceful-shutdown] all done — exiting 0');
    process.exit(0);
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });
}

module.exports = { registerShutdown, initGracefulShutdown };
