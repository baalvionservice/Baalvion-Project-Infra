import pino, { type Logger, type LoggerOptions } from 'pino';
import pinoHttp, { type Options as PinoHttpOptions } from 'pino-http';

// ─── Logger factory ───────────────────────────────────────────────────────────

const REDACTED_PATHS = [
  'password', 'passwordHash', 'password_hash',
  'token', 'refreshToken', 'refresh_token', 'accessToken', 'access_token',
  'secret', 'mfa_secret', 'mfa_pending_secret',
  'key', 'apiKey', 'api_key', 'clientSecret', 'client_secret',
  'req.headers.authorization', 'req.headers.cookie',
  'body.password', 'body.refreshToken', 'body.newPassword',
  'metadata.password', 'metadata.token',
];

export interface CreateLoggerOptions {
  service:    string;
  level?:     string;
  pretty?:    boolean;
}

export function createLogger(opts: CreateLoggerOptions): Logger {
  const isDev   = process.env.NODE_ENV !== 'production';
  const level   = opts.level ?? process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info');
  const pretty  = opts.pretty ?? isDev;

  const loggerOptions: LoggerOptions = {
    level,
    base:      { service: opts.service },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths:  REDACTED_PATHS,
      censor: '[REDACTED]',
    },
    serializers: {
      req: (req) => ({
        id:     req.id,
        method: req.method,
        url:    req.url,
        ip:     req.remoteAddress,
      }),
      res: (res) => ({ statusCode: res.statusCode }),
      err: pino.stdSerializers.err,
    },
  };

  if (pretty) {
    loggerOptions.transport = {
      target:  'pino/file',
      options: { destination: 1 }, // stdout
    };
  }

  return pino(loggerOptions);
}

// ─── HTTP request logger middleware ──────────────────────────────────────────

export function createHttpLogger(logger: Logger, opts: PinoHttpOptions = {}) {
  return pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/metrics' },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400)        return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage:   (req, res, err) => `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,
    ...opts,
  });
}

// ─── Default platform logger ───────────────────────────────────────────────────
// Each service creates its own via createLogger; this is the fallback

export const logger = createLogger({ service: 'baalvion-platform' });

export type { Logger };
