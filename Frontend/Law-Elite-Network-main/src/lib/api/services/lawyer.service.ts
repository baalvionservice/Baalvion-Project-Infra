
import { ProfileRepository, LawyerSearchParams } from '../repositories/profile.repository';
import { ProfileValidator } from '../validators/profile.validator';
import { ValidationUtils } from '../utils/validation';
import { UserRepository } from '../repositories/user.repository';
import { RankingService } from './ranking.service';
import { UserPreferenceRepository } from '../repositories/user-preference.repository';
import { CacheService } from './cache.service';
import { AlgoliaSearchService } from './algolia-search.service';
import { AnalyticsService } from './analytics.service';

export class LawyerService {
  constructor(
    private profileRepo: ProfileRepository,
    private userRepo: UserRepository,
    private preferenceRepo?: UserPreferenceRepository,
    private cacheService?: CacheService,
    private algoliaService?: AlgoliaSearchService,
    private analytics?: AnalyticsService
  ) {}

  async searchLawyers(params: LawyerSearchParams & { requestingUserId?: string }) {
    const sanitizedParams: LawyerSearchParams = {
      ...params,
      city: params.city ? ValidationUtils.sanitizeString(params.city) : undefined,
      specialization: params.specialization ? ValidationUtils.sanitizeString(params.specialization) : undefined,
      pageSize: params.pageSize ? Math.min(params.pageSize, 50) : 12,
      sortBy: params.sortBy || 'rankingBoost',
      onlyApproved: true
    };

    const cacheKey = `search:${JSON.stringify(sanitizedParams)}`;
    if (this.cacheService) {
      const cached = this.cacheService.get<any>(cacheKey);
      if (cached) return cached;
    }

    if (params.requestingUserId && this.preferenceRepo) {
      const searchTerm = [params.city, params.specialization].filter(Boolean).join(' ');
      if (searchTerm) {
        this.preferenceRepo.updatePreferences(params.requestingUserId, {
          search: searchTerm,
          city: params.city,
          caseType: params.specialization
        }).catch(err => console.error("Search tracking failed:", err));
      }
    }

    if (this.analytics) {
      this.analytics.logEvent('search_performed', { 
        city: params.city, 
        specialization: params.specialization 
      }, params.requestingUserId);
    }

    const result = await this.profileRepo.findLawyers(sanitizedParams);
    const scoredLawyers = result.docs.map(lawyer => {
      const searchScore = RankingService.calculateScore(lawyer, { city: params.city, specialization: params.specialization });
      return { ...lawyer, searchScore };
    });
    scoredLawyers.sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));
    const finalResult = { ...result, docs: scoredLawyers };

    if (this.cacheService) this.cacheService.set(cacheKey, finalResult, 1000 * 60 * 5);
    return finalResult;
  }

  async getLawyerDetails(userId: string, requestingUserId?: string) {
    if (!userId) throw new Error("User ID required.");
    const cacheKey = `lawyer:${userId}`;
    if (this.cacheService) {
      const cached = this.cacheService.get<any>(cacheKey);
      if (cached) return cached;
    }

    const profile = await this.profileRepo.getProfile('lawyer', userId);
    if (this.cacheService && profile) this.cacheService.set(cacheKey, profile, 1000 * 60 * 10);

    if (this.analytics && profile) {
      this.analytics.logEvent('lawyer_profile_view', { 
        lawyerUid: userId, 
        specialization: profile.specialization 
      }, requestingUserId);
    }

    return profile;
  }

  async updateLawyerProfile(userId: string, requestingUserId: string, isAdmin: boolean, data: any) {
    if (userId !== requestingUserId && !isAdmin) throw new Error("Unauthorized.");
    const validation = ProfileValidator.validateLawyerUpdate(data);
    if (!validation.isValid) throw new Error(Object.values(validation.errors)[0]);
    await this.profileRepo.updateProfile('lawyer', userId, validation.sanitized);
    const updatedProfile = await this.profileRepo.getProfile('lawyer', userId);
    if (this.algoliaService && updatedProfile) await this.algoliaService.syncProfile(updatedProfile);
    if (this.cacheService) {
      this.cacheService.invalidate(`lawyer:${userId}`);
      this.cacheService.invalidatePrefix('search:');
    }
    return updatedProfile;
  }

  async submitForVerification(userId: string, requestingUserId: string) {
    if (userId !== requestingUserId) throw new Error("Unauthorized.");
    const profile = await this.profileRepo.getProfile('lawyer', userId);
    if (!profile || !profile.fullName || !profile.specialization) throw new Error("Incomplete profile.");
    await this.profileRepo.updateProfile('lawyer', userId, { verificationStatus: 'pending', verificationSubmittedAt: new Date().toISOString() });
    return { success: true };
  }

  async deactivateProfile(userId: string, requestingUserId: string, isAdmin: boolean) {
    if (userId !== requestingUserId && !isAdmin) throw new Error("Unauthorized.");
    await this.userRepo.update(userId, { profileStatus: 'suspended', updatedAt: new Date().toISOString() });
    await this.profileRepo.updateProfile('lawyer', userId, { profileStatus: 'suspended' });
    if (this.algoliaService) await this.algoliaService.removeProfile(userId);
    if (this.cacheService) this.cacheService.clear();
    return { status: 'suspended' };
  }
}
