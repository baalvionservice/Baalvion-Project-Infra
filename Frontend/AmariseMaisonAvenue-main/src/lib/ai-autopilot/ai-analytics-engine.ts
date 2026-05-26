/**
 * @fileOverview AI Analytics Engine Module
 * Rule-based simulation of business intelligence.
 */

import { PrivateInquiry, CountryConfig } from '../types';

export function analyzeLeadQuality(inquiries: PrivateInquiry[]) {
  const highTier = inquiries.filter(i => i.leadTier === 1).length;
  const conversionPotential = (highTier / inquiries.length) * 100;

  if (conversionPotential > 20) {
    return "High strategic alignment. Recommend increasing private allocation invites.";
  }
  return "Market discovery phase. Recommend focusing on educational editorial content.";
}

export function detectMarketOpportunity(countries: CountryConfig[]) {
  const enabledCount = countries.filter(c => c.enabled).length;
  if (enabledCount < 5) {
    return "Untapped potential in remaining regions. Consider activating the UAE hub for status-driven growth.";
  }
  return "Global footprint established. Focus on regional strategy overrides.";
}
