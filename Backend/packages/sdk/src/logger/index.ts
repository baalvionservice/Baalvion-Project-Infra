import { loadOptional } from '../load-optional';
import type { SdkLogger, TraceProvider } from '../types';

type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface RawLogger {
  trace(obj: object, msg?: string): void;
  debug(obj: object, msg?: string): void;
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
  error(obj: object, msg?: string): void;
}

/**
 * Base structured logger. Reuses @baalvion/logger (pino + secret redaction) when
 * present; otherwise a JSON console shim so the SDK works standalone.
 */
export async function createBaseLogger(service: string, level?: string): Promise<RawLogger> {
  const mod = await loadOptional<any>('@baalvion/logger');
  if (mod?.createLogger) return mod.createLogger({ service, level }) as RawLogger;

  // Standalone JSON console shim when @baalvion/logger isn't present.
  const emit = (lvl: Level) => (obj: object, msg?: string) => {
    const line = JSON.stringify({ level: lvl, service, time: new Date().toISOString(), ...obj, ...(msg ? { msg } : {}) });
    // eslint-disable-next-line no-console
    (lvl === 'error' ? console.error : lvl === 'warn' ? console.warn : console.log)(line);
  };
  return { trace: emit('trace'), debug: emit('debug'), info: emit('info'), warn: emit('warn'), error: emit('error') };
}

/**
 * Wrap a base logger so every line is automatically stamped with the current
 * trace context (traceId, tenantId, service). `child()` adds permanent bindings.
 */
export function wrapLogger(base: RawLogger, trace: TraceProvider, bindings: Record<string, unknown> = {}): SdkLogger {
  const emit = (lvl: Level) => (obj: object | string, msg?: string) => {
    const t = trace.current();
    const ctx = t ? { traceId: t.traceId, tenantId: t.tenantId, service: t.service } : {};
    if (typeof obj === 'string') base[lvl]({ ...bindings, ...ctx }, obj);
    else base[lvl]({ ...bindings, ...ctx, ...obj }, msg);
  };
  return {
    trace: emit('trace'),
    debug: emit('debug'),
    info: emit('info'),
    warn: emit('warn'),
    error: emit('error'),
    child: (b) => wrapLogger(base, trace, { ...bindings, ...b }),
  };
}
