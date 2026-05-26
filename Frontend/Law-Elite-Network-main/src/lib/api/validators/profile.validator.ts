import { ValidationUtils } from '../utils/validation';

export class ProfileValidator {
  static validateLawyerUpdate(data: any) {
    const errors: Record<string, string> = {};

    if (data.fullName && data.fullName.length < 3) {
      errors.fullName = "Name is too short.";
    }

    if (data.experienceYears !== undefined && !ValidationUtils.isValidRange(data.experienceYears, 0, 60)) {
      errors.experienceYears = "Experience must be between 0 and 60 years.";
    }

    if (data.rating !== undefined && !ValidationUtils.isValidRange(data.rating, 0, 5)) {
      errors.rating = "Rating must be between 0 and 5.";
    }

    if (data.specialization && (!Array.isArray(data.specialization) || data.specialization.length === 0)) {
      errors.specialization = "At least one specialization is required.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        ...data,
        fullName: data.fullName ? ValidationUtils.sanitizeString(data.fullName) : undefined,
      }
    };
  }
}
