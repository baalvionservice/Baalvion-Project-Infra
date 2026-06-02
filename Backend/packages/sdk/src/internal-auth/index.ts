import crypto from 'node:crypto';
import type { InternalAuth, InternalAuthOptions, SignableRequest, SdkMiddleware } from '../types';

export const SECRET_HEADER = 'x-internal-secret';
export const SERVICE_HEADER = 'x-internal-service';
export const TS_HEADER = 'x-internal-timestamp';
export const SIG_HEADER = 'x-internal-signature';

/**
 * Service-to-service authentication. Standardizes the ad-hoc `x-internal-secret`
 * guard already used by cms-service into one module, and adds an HMAC scheme
 * (timestamped signature over method|path|body) matching the finance WebhookSigner
 * pattern. Also exposes a role gate for verified user principals.
 */
export function createInternalAuth(opts: InternalAuthOptions): InternalAuth {
  const scheme = opts.scheme ?? 'shared-secret';
  const skewMs = (opts.clockSkewSeconds ?? 300) * 1000;

  function hmac(ts: string, req?: SignableRequest): string {
    const canonical = [ts, req?.method ?? '', req?.path ?? '', req?.body ?? ''].join('\n');
    return crypto.createHmac('sha256', opts.secret).update(canonical).digest('hex');
  }

  function signHeaders(req?: SignableRequest): Record<string, string> {
    const base: Record<string, string> = { [SERVICE_HEADER]: opts.serviceName };
    if (scheme === 'shared-secret') return { ...base, [SECRET_HEADER]: opts.secret };
    const ts = String(Date.now());
    return { ...base, [TS_HEADER]: ts, [SIG_HEADER]: hmac(ts, req) };
  }

  function verify(headers: Record<string, string | undefined>, req?: SignableRequest): boolean {
    if (scheme === 'shared-secret') {
      const v = headers[SECRET_HEADER];
      return !!v && timingSafeEq(v, opts.secret);
    }
    const ts = headers[TS_HEADER];
    const sig = headers[SIG_HEADER];
    if (!ts || !sig) return false;
    if (Math.abs(Date.now() - Number(ts)) > skewMs) return false;
    return timingSafeEq(sig, hmac(ts, req));
  }

  function verifyMiddleware(): SdkMiddleware {
    return (req, res, next) => {
      const ok = verify(req.headers ?? {}, {
        method: req.method,
        path: req.originalUrl ?? req.url,
        body: typeof req.rawBody === 'string' ? req.rawBody : undefined,
      });
      if (!ok) {
        opts.logger?.warn?.({ path: req.url }, 'internal-auth: rejected unsigned/invalid request');
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'invalid internal service credentials' } });
        return;
      }
      req.internalCaller = req.headers?.[SERVICE_HEADER] ?? null;
      next();
    };
  }

  function requireRole(...roles: string[]): SdkMiddleware {
    return (req, res, next) => {
      const have: string[] = req.auth?.roles ?? [];
      if (have.includes('super_admin') || roles.some((r) => have.includes(r))) return next();
      res.status(403).json({ error: { code: 'FORBIDDEN', message: `requires one of: ${roles.join(', ')}` } });
    };
  }

  return { signHeaders, verify, verifyMiddleware, requireRole };
}

function timingSafeEq(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
