export class AppError extends Error {
  public readonly code:       string;
  public readonly statusCode: number;
  public readonly details:    unknown;
  public readonly isOperational: boolean;

  constructor(
    code:       string,
    message:    string,
    statusCode  = 400,
    details:    unknown = {},
  ) {
    super(message);
    this.name          = 'AppError';
    this.code          = code;
    this.statusCode    = statusCode;
    this.details       = details;
    this.isOperational = true;

    // Maintains proper stack trace for where our error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// ── Typed error factories — use these instead of raw `new AppError` ───────────

export const Errors = {
  // Auth
  invalidCredentials:   ()           => new AppError('INVALID_CREDENTIALS',     'Invalid email or password',                       401),
  accountDisabled:      ()           => new AppError('ACCOUNT_DISABLED',        'Account is suspended or inactive',                403),
  emailTaken:           ()           => new AppError('EMAIL_TAKEN',             'Email already registered',                        409),
  unauthorized:         (msg?:string)=> new AppError('UNAUTHORIZED',            msg ?? 'Authentication required',                  401),
  forbidden:            (msg?:string)=> new AppError('FORBIDDEN',               msg ?? 'Insufficient permissions',                 403),
  rateLimited:          (msg?:string)=> new AppError('RATE_LIMITED',            msg ?? 'Too many requests. Please slow down.',     429),

  // Tokens
  invalidToken:         ()           => new AppError('INVALID_TOKEN',           'Token is invalid or expired',                     401),
  refreshTokenReuse:    ()           => new AppError('REFRESH_TOKEN_REUSE',     'Session invalidated. Please log in again.',       401),
  tokenBlacklisted:     ()           => new AppError('TOKEN_BLACKLISTED',       'Token has been revoked',                          401),

  // MFA
  mfaChallengeRequired: ()           => new AppError('MFA_CHALLENGE_REQUIRED',  'MFA challenge token required',                    400),
  mfaChallengeExpired:  ()           => new AppError('MFA_CHALLENGE_EXPIRED',   'MFA challenge expired. Please log in again.',     401),
  invalidMfaCode:       (remaining:number) => new AppError('INVALID_MFA_CODE', `Invalid MFA code (${remaining} attempts left)`,   401),
  mfaLocked:            ()           => new AppError('MFA_LOCKED',              'Too many failed MFA attempts. Log in again.',     429),
  mfaNotInitialized:    ()           => new AppError('MFA_NOT_INITIALIZED',     'MFA setup not started',                           400),

  // Resources
  notFound:             (resource?:string) => new AppError('NOT_FOUND',         `${resource ?? 'Resource'} not found`,             404),
  conflict:             (msg:string) => new AppError('CONFLICT',                msg,                                               409),
  validation:           (details?:unknown) => new AppError('VALIDATION_ERROR',  'Invalid input',                                   400, details),

  // OAuth
  invalidClient:        ()           => new AppError('INVALID_CLIENT',          'Unknown or invalid client',                       400),
  invalidGrant:         (msg?:string)=> new AppError('INVALID_GRANT',           msg ?? 'Invalid or expired grant',                 400),
  invalidScope:         (scopes:string) => new AppError('INVALID_SCOPE',        `Invalid scopes: ${scopes}`,                       400),
  invalidRedirect:      ()           => new AppError('INVALID_REDIRECT',        'redirect_uri not registered for this client',     400),

  // Security
  csrfFailed:           ()           => new AppError('CSRF_FAILED',             'CSRF validation failed',                          403),
  ssrfBlocked:          ()           => new AppError('SSRF_BLOCKED',            'Request to internal resource blocked',            403),

  // Internal
  internal:             (msg?:string)=> new AppError('INTERNAL_ERROR',          msg ?? 'An unexpected error occurred',             500),
  serviceUnavailable:   ()           => new AppError('SERVICE_UNAVAILABLE',     'Service temporarily unavailable',                 503),
} as const;

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function isOperationalError(err: unknown): boolean {
  return isAppError(err) && err.isOperational;
}
