
import { LawyerService } from '../services/lawyer.service';
import { ApiResponse } from '../types';
import { LawyerSearchParams } from '../repositories/profile.repository';

export class LawyerController {
  constructor(private lawyerService: LawyerService) {}

  async searchLawyers(params: LawyerSearchParams): Promise<ApiResponse> {
    try {
      const result = await this.lawyerService.searchLawyers(params);
      
      return {
        success: true,
        message: 'Lawyers discovered successfully',
        data: {
          lawyers: result.docs,
          nextCursor: result.lastSnapshot,
          hasMore: result.hasMore,
          count: result.count
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to search lawyers',
        error: error.message || 'INTERNAL_SEARCH_ERROR'
      };
    }
  }

  async getLawyer(userId: string): Promise<ApiResponse> {
    try {
      const data = await this.lawyerService.getLawyerDetails(userId);
      if (!data) return { success: false, message: 'Lawyer not found' };
      return { success: true, message: 'Lawyer details fetched', data };
    } catch (error: any) {
      return { success: false, message: 'Error fetching details', error: error.message };
    }
  }

  async updateProfile(req: { userId: string, requestingUserId: string, isAdmin: boolean, profileData: any }): Promise<ApiResponse> {
    try {
      const data = await this.lawyerService.updateLawyerProfile(
        req.userId, 
        req.requestingUserId, 
        req.isAdmin, 
        req.profileData
      );
      return {
        success: true,
        message: 'Professional profile synchronized successfully.',
        data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Profile update failed',
        error: error.code || 'UPDATE_ERROR'
      };
    }
  }

  async submitForVerification(req: { userId: string; requestingUserId: string }): Promise<ApiResponse> {
    try {
      await this.lawyerService.submitForVerification(req.userId, req.requestingUserId);
      return { success: true, message: 'Profile submitted for elite audit.' };
    } catch (error: any) {
      return { success: false, message: 'Submission failed', error: error.message };
    }
  }

  async deactivate(userId: string, requestingUserId: string, isAdmin: boolean): Promise<ApiResponse> {
    try {
      await this.lawyerService.deactivateProfile(userId, requestingUserId, isAdmin);
      return { success: true, message: 'Profile deactivated. You will no longer appear in search results.' };
    } catch (error: any) {
      return { success: false, message: 'Deactivation failed', error: error.message };
    }
  }
}
