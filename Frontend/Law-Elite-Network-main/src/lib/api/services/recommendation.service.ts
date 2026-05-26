
"use client";

import { ProfileRepository } from '../repositories/profile.repository';
import { CaseRepository } from '../repositories/case.repository';
import { CaseMatchRepository } from '../repositories/case-match.repository';
import { NotificationService } from './notification.service';
import { SubscriptionTier } from '../types';
import { CacheService } from './cache.service';

export interface RecommendationResult {
  userId: string;
  fullName: string;
  score: number;
  matchReasons: string[];
  specialization: string[];
  rating: number;
  experienceYears: number;
  location: any;
}

export class RecommendationService {
  constructor(
    private profileRepo: ProfileRepository,
    private caseRepo: CaseRepository,
    private matchRepo?: CaseMatchRepository,
    private notificationService?: NotificationService,
    private cacheService?: CacheService
  ) {}

  /**
   * Generates a ranked list of recommended lawyers for a specific case.
   * Uses caching to handle high-frequency dashboard requests.
   */
  async getRecommendations(caseId: string, maxResults: number = 5): Promise<RecommendationResult[]> {
    const cacheKey = `recs:${caseId}:${maxResults}`;
    
    if (this.cacheService) {
      const cached = this.cacheService.get<RecommendationResult[]>(cacheKey);
      if (cached) return cached;
    }

    const caseData = await this.caseRepo.getById(caseId) as any;
    if (!caseData) throw new Error("Case dossier not found.");

    const lawyersResponse = await this.profileRepo.findLawyers({
      pageSize: 50,
      onlyApproved: true
    });

    const lawyers = lawyersResponse.docs;
    const recommendations: RecommendationResult[] = [];

    for (const lawyer of lawyers) {
      const scoreData = this.calculateScore(caseData, lawyer);
      recommendations.push({
        userId: lawyer.userId,
        fullName: lawyer.fullName,
        score: scoreData.totalScore,
        matchReasons: scoreData.reasons,
        specialization: lawyer.specialization,
        rating: lawyer.rating || 5.0,
        experienceYears: lawyer.experienceYears || 0,
        location: lawyer.location
      });
    }

    const sorted = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    if (this.cacheService) {
      this.cacheService.set(cacheKey, sorted, 1000 * 60 * 10); // 10m TTL
    }

    return sorted;
  }

  async processCaseMatching(caseId: string) {
    if (!this.matchRepo || !this.notificationService) return;

    try {
      const recommendations = await this.getRecommendations(caseId, 5);
      
      const promises = recommendations.map(async (rec) => {
        await this.matchRepo!.create({
          caseId,
          lawyerUid: rec.userId,
          score: rec.score
        });

        await this.notificationService!.notify(
          rec.userId,
          'new_case_match',
          'Intelligent Brief Match',
          `A new legal brief matching your profile in ${rec.specialization[0]} has been posted.`,
          caseId
        );
      });

      await Promise.all(promises);
    } catch (error) {
      console.error("Case matching process failed:", error);
    }
  }

  private calculateScore(caseData: any, lawyer: any) {
    let totalScore = 0;
    const reasons: string[] = [];

    const hasDomainMatch = lawyer.specialization?.some((spec: string) => 
      spec.toLowerCase() === caseData.caseType.toLowerCase()
    );
    if (hasDomainMatch) {
      totalScore += 40;
      reasons.push(`Expertise in ${caseData.caseType}`);
    }

    if (lawyer.location?.city === caseData.location?.city) {
      totalScore += 20;
      reasons.push(`Local practitioner in ${caseData.location?.city}`);
    }

    const experiencePoints = Math.min((lawyer.experienceYears || 0) / 20 * 15, 15);
    totalScore += experiencePoints;
    if (lawyer.experienceYears > 15) reasons.push("Distinguished career (15+ years)");

    const ratingPoints = ((lawyer.rating || 5.0) / 5) * 15;
    totalScore += ratingPoints;
    if (lawyer.rating >= 4.8) reasons.push("Exceptional client feedback");

    const tier = (lawyer.subscriptionTier as SubscriptionTier) || 'BASIC';
    if (tier === 'ELITE') {
      totalScore += 10;
      reasons.push("Premier Elite Network status");
    } else if (tier === 'PRO') {
      totalScore += 5;
      reasons.push("Verified Professional status");
    }

    return { totalScore: Math.round(totalScore), reasons };
  }
}
