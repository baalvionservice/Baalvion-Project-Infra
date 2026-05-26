/**
 * @fileOverview Institutional AI Recommendation Engine
 * Implements weighted resonance scoring for personalized luxury discovery.
 */

import { Product, Transaction, CartItem, CountryCode } from '../types';

export interface RecommendationNode {
  productId: string;
  score: number;
  reason: string;
}

export class RecommendationEngine {
  /**
   * Generates a personalized set of recommendations for a connoisseur.
   */
  static async getPersonalizedResonance(
    userTransactions: Transaction[],
    currentCart: CartItem[],
    allProducts: Product[],
    hub: CountryCode,
    limit: number = 4
  ): Promise<RecommendationNode[]> {
    
    // 1. Identify "Affinity Categories" from history
    const affinityCategories = new Set(userTransactions.map(t => t.artifactName?.split(' ')[0] || ''));
    const cartCategories = new Set(currentCart.map(i => i.categoryId));

    // 2. Score artifacts in the registry
    const scoredProducts: RecommendationNode[] = allProducts
      .filter(p => p.regions.includes(hub) && p.stock > 0)
      .map(p => {
        let score = 0.1; // Base score
        let reason = "A curated selection for your archive.";

        // Category Resonance
        if (cartCategories.has(p.categoryId)) {
          score += 0.4;
          reason = `Synergistic with your active cart intent.`;
        } else if (affinityCategories.has(p.name.split(' ')[0])) {
          score += 0.3;
          reason = `Aligned with your previous acquisitions.`;
        }

        // Tier Resonance (VIP status alignment)
        if (p.isVip) score += 0.1;

        return { productId: p.id, score, reason };
      });

    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Identifies artifacts with high market velocity within a hub.
   */
  static getTrendingInHub(
    allTransactions: Transaction[],
    allProducts: Product[],
    hub: CountryCode,
    limit: number = 4
  ): RecommendationNode[] {
    const hubTransactions = allTransactions.filter(t => t.country === hub);
    const productFrequency: Record<string, number> = {};

    hubTransactions.forEach(t => {
      const name = t.artifactName || '';
      productFrequency[name] = (productFrequency[name] || 0) + 1;
    });

    return allProducts
      .filter(p => p.regions.includes(hub) && p.stock > 0)
      .map(p => ({
        productId: p.id,
        score: (productFrequency[p.name] || 0) / 10 + 0.5,
        reason: `Highly resonant within the ${hub.toUpperCase()} hub.`
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
