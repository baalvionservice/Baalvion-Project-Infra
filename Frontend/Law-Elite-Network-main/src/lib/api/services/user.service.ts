
import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { UserRole, ProfileStatus } from '../types';
import { ValidationUtils } from '../utils/validation';
import { ProfileValidator } from '../validators/profile.validator';
import { AlgoliaSearchService } from './algolia-search.service';

/**
 * @fileOverview UserService
 * Handles core user operations and the onboarding lifecycle.
 */
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private profileRepo: ProfileRepository,
    private algoliaService?: AlgoliaSearchService
  ) {}

  /**
   * Completes the onboarding process by assigning a role and creating a profile.
   */
  async completeOnboarding(userId: string, roleId: 'lawyer' | 'client', profileData: any) {
    if (!userId) throw new Error("User identification required.");
    
    // 1. Validate Profile Data based on role
    if (roleId === 'lawyer') {
      const validation = ProfileValidator.validateLawyerUpdate(profileData);
      if (!validation.isValid) throw new Error(Object.values(validation.errors)[0]);
    }

    // 2. Prepare Profile Payload
    const finalProfileData = {
      ...profileData,
      userId,
      profileStatus: 'active' as ProfileStatus,
      updatedAt: new Date().toISOString()
    };

    // 3. Update core user record
    await this.userRepo.update(userId, {
      roleId,
      profileStatus: 'active' as ProfileStatus,
      updatedAt: new Date().toISOString()
    });

    // 4. Create specialized profile
    const profile = await this.profileRepo.createProfile(roleId, userId, finalProfileData);

    // 5. Sync to Algolia if lawyer
    if (roleId === 'lawyer' && this.algoliaService) {
      await this.algoliaService.syncProfile(profile);
    }

    return profile;
  }

  async getUser(userId: string) {
    return await this.userRepo.findById(userId);
  }
}
