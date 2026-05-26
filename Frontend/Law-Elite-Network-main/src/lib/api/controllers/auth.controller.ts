
import { AuthService } from '../services/auth.service';
import { LoggingService } from '../services/logging.service';
import { ApiResponse } from '../types';

export class AuthController {
  constructor(
    private authService: AuthService,
    private logging?: LoggingService
  ) {}

  async register(req: { email: string; fullName: string; roleId: 'lawyer' | 'client'; password?: string }): Promise<ApiResponse> {
    try {
      if (!req.email || !req.fullName || !req.roleId) {
        return { success: false, message: 'Missing required fields', error: 'VALIDATION_ERROR' };
      }

      const data = await this.authService.register(req);
      if (this.logging) this.logging.info("New member application submitted", { email: req.email, roleId: req.roleId });
      
      return {
        success: true,
        message: 'Registration successful',
        data
      };
    } catch (error: any) {
      if (this.logging) this.logging.error("Registration failure", { email: req.email, error: error.message });
      return {
        success: false,
        message: error.message || 'Internal Server Error',
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  async login(req: { email: string; password?: string }): Promise<ApiResponse> {
    const startTime = Date.now();
    try {
      if (!req.email) {
        return { success: false, message: 'Email is required', error: 'VALIDATION_ERROR' };
      }

      const data = await this.authService.login(req.email, req.password);
      
      if (this.logging) {
        this.logging.trackPerformance("Auth Lifecycle: Login", startTime, { email: req.email });
        this.logging.info("Authorized connection established", { email: req.email });
      }

      return {
        success: true,
        message: 'Login successful',
        data
      };
    } catch (error: any) {
      if (this.logging) this.logging.warn("Unauthorized access attempt", { email: req.email, error: error.message });
      return {
        success: false,
        message: error.message || 'Authentication Failed',
        error: error.code || 'AUTH_ERROR'
      };
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      await this.authService.logout();
      if (this.logging) this.logging.info("Member session terminated");
      return { success: true, message: 'Logged out successfully' };
    } catch (error: any) {
      if (this.logging) this.logging.error("Logout error", { error: error.message });
      return { success: false, message: 'Logout failed', error: error.message };
    }
  }
}
