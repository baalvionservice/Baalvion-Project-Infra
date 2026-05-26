import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';
import { Errors } from '@baalvion/errors';
import type { AccessTokenPayload, UserRole } from '@baalvion/types';
import type { Logger } from '@baalvion/logger';
import { requireRole, requirePermission, requireSuperAdmin, requireOrgAdmin } from '@baalvion/rbac';

// Re-export RBAC guards for convenience
export { requireRole, requirePermission, requireSuperAdmin, requireOrgAdmin };

// ─── Auth Middleware ──────────────────────────────────────────────────────────

export interface AuthMiddlewareOptions {
  /** Function to load the public key for RS256 verification */
  getPublicKey: () => string | Buffer;
  /** Optional function to check if a JTI is blacklisted */
  isBlacklisted?: (jti: string) => Promise<boolean>;
  issuer:   string;
  audience: string;
}

export function createAuthMiddleware(opts: AuthMiddlewareOptions) {
  return async function authMiddleware(
    req:  Request,
    res:  Response,
    next: NextFunction,
  ): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      next(Errors.unauthorized('Bearer token required'));
      return;
    }

    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, opts.getPublicKey(), {
        algorithms: ['RS256'],
        issuer:     opts.issuer,
        audience:   opts.audience,
      }) as AccessTokenPayload;

      // JTI blacklist check (logout / revocation)
      if (decoded.jti && opts.isBlacklisted) {
        const blacklisted = await opts.isBlacklisted(decoded.jti);
        if (blacklisted) { next(Errors.tokenBlacklisted()); return; }
      }

      req.auth = {
        userId:          decoded.sub,
        email:           decoded.email,
        orgId:           decoded.org_id,
        role:            decoded.role as UserRole,
        permissions:     decoded.permissions ?? [],
        sessionId:       decoded.sid,
        jti:             decoded.jti,
        isImpersonation: !!decoded.impersonated_by,
        impersonatedBy:  decoded.impersonated_by,
      };

      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        next(Errors.invalidToken());
      } else if (err instanceof jwt.JsonWebTokenError) {
        next(Errors.unauthorized('Invalid token'));
      } else {
        next(err);
      }
    }
  };
}

// ─── CSRF Middleware ──────────────────────────────────────────────────────────

const CSRF_COOKIE    = 'baalvion-csrf';
const CSRF_HEADER    = 'x-csrf-token';
const SAFE_METHODS   = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfTokenMiddleware(isProd: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.cookies?.[CSRF_COOKIE]) {
      const token = randomBytes(32).toString('base64url');
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure:   isProd,
        sameSite: 'strict',
        maxAge:   24 * 60 * 60 * 1000,
        path:     '/',
      });
      req.csrfToken = token;
    } else {
      req.csrfToken = req.cookies[CSRF_COOKIE];
    }
    next();
  };
}

export function csrfProtect(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) { next(); return; }
  // Bearer-authenticated requests are not CSRF-vulnerable
  if (req.headers.authorization?.startsWith('Bearer ')) { next(); return; }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(Errors.csrfFailed());
    return;
  }
  next();
}

// ─── Request Context Middleware ───────────────────────────────────────────────

export function createRequestContext(httpLogger: ReturnType<typeof import('@baalvion/logger').createHttpLogger>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    req.requestId = uuidv4();
    req.startTime = Date.now();
    res.setHeader('X-Request-Id', req.requestId);
    httpLogger(req, res, next);
  };
}

// ─── Redis-backed rate limiter ────────────────────────────────────────────────

export interface RateLimiterOptions {
  max:       number;
  window:    number;    // seconds
  prefix:    string;
  keyFn:     (req: Request) => string;
  message?:  string;
}

export interface RedisRateLimitClient {
  pipeline(): { incr(key: string): any; expire(key: string, ttl: number): any; exec(): Promise<[null, number][]> };
}

export function createRateLimiter(
  opts:   RateLimiterOptions,
  getClient: () => RedisRateLimitClient | null,
) {
  return async function rateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = getClient();
      if (!client) { next(); return; }

      const key = `${opts.prefix}:${opts.keyFn(req)}`;
      const [[, count]] = await client.pipeline().incr(key).expire(key, opts.window).exec() as [null, number][];

      res.setHeader('X-RateLimit-Limit',     String(opts.max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, opts.max - count)));
      res.setHeader('X-RateLimit-Reset',     String(Math.floor(Date.now() / 1000) + opts.window));

      if (count > opts.max) {
        next(Errors.rateLimited(opts.message));
        return;
      }
    } catch { /* fail open */ }
    next();
  };
}

// ─── Service-to-service HMAC auth ─────────────────────────────────────────────

import { createHmac, timingSafeEqual } from 'crypto';

export function createServiceAuthMiddleware(secret: string, maxAgeMs = 30_000) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const sig   = req.headers['x-service-sig']   as string | undefined;
    const ts    = req.headers['x-service-ts']    as string | undefined;
    const nonce = req.headers['x-service-nonce'] as string | undefined;

    if (!sig || !ts || !nonce) { next(Errors.unauthorized('Service auth required')); return; }

    const age = Date.now() - Number(ts);
    if (age > maxAgeMs || age < 0) { next(Errors.unauthorized('Request timestamp out of range')); return; }

    const bodyHash = createHmac('sha256', 'hash').update(JSON.stringify(req.body) ?? '').digest('hex');
    const message  = `${req.method}:${req.path}:${ts}:${nonce}:${bodyHash}`;
    const expected = createHmac('sha256', secret).update(message).digest('hex');

    try {
      if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        next(Errors.unauthorized('Invalid service signature'));
        return;
      }
    } catch {
      next(Errors.unauthorized('Invalid service signature'));
      return;
    }

    next();
  };
}

// ─── Extend Express types ─────────────────────────────────────────────────────
declare module 'express-serve-static-core' {
  interface Request {
    csrfToken?: string;
  }
}
