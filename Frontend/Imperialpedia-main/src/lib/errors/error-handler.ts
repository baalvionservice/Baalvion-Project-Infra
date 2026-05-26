import { AppError } from './AppError';
import { logger } from './logger';

/**
 * @fileOverview Standardized error handling logic for the platform.
 */

export const errorHandler = {
  /**
   * Processes an error, logs it, and returns a standardized AppError object.
   */
  handleError: (error: any): AppError => {
    if (error instanceof AppError) {
      logger.error(error.message, error);
      return error;
    }

    // Wrap generic errors into the AppError structure
    const appError = new AppError(
      error.message || 'An unexpected error occurred',
      error.status || 500,
      error.code || 'INTERNAL_ERROR',
      false // Generic errors are usually not considered "operational"
    );

    logger.error(appError.message, error);
    return appError;
  },

  /**
   * Formats an error object for UI or API responses.
   */
  formatErrorResponse: (error: AppError) => {
    return {
      success: false,
      message: error.message,
      errorCode: error.errorCode,
      timestamp: error.timestamp,
      // Status code is useful for internal handling but usually stripped for public responses
    };
  },
};
