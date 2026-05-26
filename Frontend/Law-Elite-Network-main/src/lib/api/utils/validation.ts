/**
 * Core validation and sanitization utilities.
 */

export const ValidationUtils = {
  isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isNonEmptyString(val: any): boolean {
    return typeof val === 'string' && val.trim().length > 0;
  },

  isValidRange(val: number, min: number, max: number): boolean {
    return typeof val === 'number' && val >= min && val <= max;
  },

  sanitizeString(val: string): string {
    return val ? val.trim() : '';
  },

  sanitizeEmail(val: string): string {
    return val ? val.trim().toLowerCase() : '';
  }
};
