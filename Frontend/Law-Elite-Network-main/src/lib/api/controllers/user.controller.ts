
import { UserService } from '../services/user.service';
import { ApiResponse } from '../types';

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Finalizes the user setup process.
   */
  async completeOnboarding(req: { userId: string; roleId: 'lawyer' | 'client'; profileData: any }): Promise<ApiResponse> {
    try {
      const data = await this.userService.completeOnboarding(req.userId, req.roleId, req.profileData);
      return {
        success: true,
        message: 'Onboarding completed successfully. Welcome to the network.',
        data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Onboarding failed',
        error: error.code || 'ONBOARDING_ERROR'
      };
    }
  }

  async getMe(userId: string): Promise<ApiResponse> {
    try {
      const user = await this.userService.getUser(userId);
      return { success: true, message: 'User found', data: user };
    } catch (error: any) {
      return { success: false, message: 'User not found', error: error.message };
    }
  }
}
