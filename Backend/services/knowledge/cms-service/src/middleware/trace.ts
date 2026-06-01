import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { sdk } from '../platform/sdk';

/**
 * ⚠️ PHASE-F SEED (typed contract — NOT the current runtime; the live runtime is
 * `platform/trace.js`). See `src/platform/sdk.ts` for the migration note.
 *
 * SDK-native trace middleware.
 *
 * Binds a traceId (+ tenantId/userId) to the request via sdk.trace, exposes it as
 * `req.traceId`, and echoes it in the `x-trace-id` response header. Every
 * sdk.logger / sdk.http / sdk.events call within the request automatically carries
 * this id — no manual plumbing. Mount this before the route layer.
 */
let inner: RequestHandler | null = null;

export const traceMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!inner) inner = sdk().trace.middleware() as RequestHandler;
  inner(req, res, () => {
    const ctx = (req as Request & { trace?: { traceId?: string } }).trace;
    if (ctx?.traceId) {
      (req as Request & { traceId?: string }).traceId = ctx.traceId;
      res.setHeader('x-trace-id', ctx.traceId);
    }
    next();
  });
};
