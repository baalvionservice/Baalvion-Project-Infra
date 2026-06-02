import { AsyncLocalStorage } from 'node:async_hooks';
import { newId } from '../id';
import type { TraceContext, TraceProvider, SdkMiddleware } from '../types';

export const TRACE_HEADER = 'x-trace-id';
export const TENANT_HEADER = 'x-tenant-id';

/**
 * AsyncLocalStorage-backed trace context. One traceId (+ tenantId/userId) is
 * bound for the entire async subtree of a request, so logs, outbound HTTP calls,
 * and emitted events all carry the same correlation id with zero plumbing.
 */
export function createTraceProvider(service: string): TraceProvider {
  const als = new AsyncLocalStorage<TraceContext>();

  const current = (): TraceContext | undefined => als.getStore();

  function runWith<T>(ctx: Partial<TraceContext>, fn: () => T): T {
    const base = als.getStore();
    const merged: TraceContext = {
      traceId: ctx.traceId ?? base?.traceId ?? newId(),
      spanId: ctx.spanId ?? base?.spanId,
      tenantId: ctx.tenantId ?? base?.tenantId ?? null,
      userId: ctx.userId ?? base?.userId ?? null,
      service,
    };
    return als.run(merged, fn);
  }

  function middleware(): SdkMiddleware {
    return (req, res, next) => {
      const headers = req.headers ?? {};
      const traceparent = typeof headers['traceparent'] === 'string' ? headers['traceparent'] : undefined;
      const fromTraceparent = traceparent ? traceparent.split('-')[1] : undefined;
      const traceId = headers[TRACE_HEADER] || fromTraceparent || newId();
      const tenantId = headers[TENANT_HEADER] || req.auth?.orgId || null;
      const userId = req.auth?.userId ?? req.auth?.subject ?? null;
      res.setHeader?.(TRACE_HEADER, traceId);
      runWith({ traceId, tenantId, userId }, () => {
        req.trace = current();
        next();
      });
    };
  }

  function outboundHeaders(): Record<string, string> {
    const c = current();
    if (!c) return {};
    const h: Record<string, string> = { [TRACE_HEADER]: c.traceId };
    if (c.tenantId) h[TENANT_HEADER] = c.tenantId;
    return h;
  }

  return { current, runWith, middleware, outboundHeaders };
}
