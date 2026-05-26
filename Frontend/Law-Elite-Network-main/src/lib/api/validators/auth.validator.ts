
import { ValidationUtils } from '../utils/validation';
import { UserRole } from '../types';

export class AuthValidator {
  static validateRegister(data: { email: string; fullName: string; roleId: string; password?: string }) {
    const errors: Record<string, string> = {};

    if (!ValidationUtils.isValidEmail(data.email)) {
      errors.email = "Invalid professional email format.";
    }

    if (!ValidationUtils.isNonEmptyString(data.fullName) || data.fullName.length < 3) {
      errors.fullName = "Full name must be at least 3 characters.";
    }

    const validRoles: UserRole[] = ['lawyer', 'client', 'admin'];
    if (!validRoles.includes(data.roleId as UserRole)) {
      errors.roleId = "Invalid professional role selected.";
    }

    if (data.password && data.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        email: ValidationUtils.sanitizeEmail(data.email),
        fullName: ValidationUtils.sanitizeString(data.fullName),
        roleId: data.roleId as UserRole,
        password: data.password
      }
    };
  }

  static validateLogin(email: string, password?: string) {
    const errors: Record<string, string> = {};
    
    if (!ValidationUtils.isValidEmail(email)) {
      errors.email = "Invalid email format.";
    }

    if (password && password.length < 6) {
      errors.password = "Invalid password.";
    }

    return { 
      isValid: Object.keys(errors).length === 0, 
      errors,
      sanitizedEmail: ValidationUtils.sanitizeEmail(email) 
    };
  }
}
