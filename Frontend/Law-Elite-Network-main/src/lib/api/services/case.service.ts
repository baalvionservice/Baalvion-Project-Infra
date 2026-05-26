
import { CaseRepository, CaseSearchParams } from '../repositories/case.repository';
import { RecommendationService } from './recommendation.service';
import { UserPreferenceRepository } from '../repositories/user-preference.repository';
import { UserRole } from '../types';
import { AnalyticsService } from './analytics.service';

export class CaseService {
  constructor(
    private caseRepo: CaseRepository,
    private recommendationService?: RecommendationService,
    private preferenceRepo?: UserPreferenceRepository,
    private analytics?: AnalyticsService
  ) {}

  async createCase(clientUid: string, role: UserRole, data: any) {
    if (role !== 'client') throw new Error("Unauthorized: Only premier clients can post legal briefs.");
    if (!data.title || !data.description || !data.caseType) throw new Error("Validation Error: Title, description, and case type are required.");

    const payload = {
      ...data,
      clientUid,
      status: 'open',
      visibility: data.visibility || 'public'
    };

    const newCase = await this.caseRepo.create(payload);

    if (this.preferenceRepo) {
      this.preferenceRepo.updatePreferences(clientUid, {
        caseType: data.caseType,
        city: data.location?.city
      }).catch(err => console.error("Preference update failed:", err));
    }

    if (this.recommendationService) {
      this.recommendationService.processCaseMatching(newCase.caseId).catch(err => console.error("Async matching trigger failed:", err));
    }

    if (this.analytics) {
      this.analytics.logEvent('case_created', { 
        caseId: newCase.caseId, 
        caseType: data.caseType, 
        city: data.location?.city 
      }, clientUid);
    }

    return newCase;
  }

  async getClientCases(clientUid: string) { return await this.caseRepo.findCases({ clientUid }); }
  async getPublicCases(params: CaseSearchParams = {}) { return await this.caseRepo.findCases({ ...params, status: 'open' }); }

  async closeCase(caseId: string, clientUid: string, isAdmin: boolean) {
    const existing = await this.caseRepo.getById(caseId);
    if (!existing) throw new Error("Case not found.");
    if (existing.clientUid !== clientUid && !isAdmin) throw new Error("Unauthorized: Only owner or admin can close.");
    await this.caseRepo.update(caseId, { status: 'closed' });
  }
}
