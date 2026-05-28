import type { Request, Response } from 'express';
import type { Paginated } from '@baalvion/types';
import { AppError, isAppError } from '@baalvion/errors';

// ─── Success responses ────────────────────────────────────────────────────────

export function sendSuccess<T>(
  req:        Request,
  res:        Response,
  data:       T,
  statusCode  = 200,
): void {
  res.status(statusCode).json({
    success:   true,
    data,
    requestId: req.requestId ?? 'unknown',
  });
}

export function sendPaginated<T>(
  req:    Request,
  res:    Response,
  result: Paginated<T>,
): void {
  res.status(200).json({
    success:   true,
    data:      result,
    requestId: req.requestId ?? 'unknown',
  });
}

// ─── Error response ────────────────────────────────────────────────────────────

export function sendError(
  req:        Request,
  res:        Response,
  err:        unknown,
): void {
  if (isAppError(err)) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code:      err.code,
        message:   err.message,
        details:   err.details,
        requestId: req.requestId ?? 'unknown',
      },
    });
    return;
  }

  // Unknown/unexpected error
  res.status(500).json({
    success: false,
    error: {
      code:      'INTERNAL_ERROR',
      message:   'An unexpected error occurred',
      requestId: req.requestId ?? 'unknown',
    },
  });
}

// ─── Express error handler middleware ─────────────────────────────────────────

export function createErrorHandler(logger: { error: (obj: object, msg: string) => void }) {
  return function errorHandler(
    err:  unknown,
    req:  Request,
    res:  Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: Function,
  ): void {
    if (!isAppError(err)) {
      logger.error({ err, requestId: req.requestId }, 'Unhandled error');
    } else if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.requestId }, 'Server error');
    }
    sendError(req, res, err);
  };
}

export function createNotFoundHandler() {
  return function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
      success: false,
      error: {
        code:      'NOT_FOUND',
        message:   `Route ${req.method} ${req.url} not found`,
        requestId: req.requestId ?? 'unknown',
      },
    });
  };
}
