/**
 * @fileOverview Institutional Dynamic Pricing Engine
 * Optimizes artifact value based on demand, scarcity, and regional liquidity.
 * Includes Maison Integrity Rails (+20% / -30% caps).
 */

import { Product, CountryCode, DynamicPrice, PrivateInquiry } from '../types';

export interface PricingSignals {
  inquiryCount: number;
  stockLevel: number;
  hubLiquidity: number; // 0 to 1
}

export class DynamicPricingEngine {
  private static MAX_INCREASE = 0.20; // +20%
  private static MAX_DECREASE = 0.30; // -30%

  /**
   * Calculates the optimized price for an artifact.
   */
  static optimizePrice(
    product: Product,
    country: CountryCode,
    signals: PricingSignals
  ): DynamicPrice {
    let multiplier = 1.0;
    const reasons: string[] = [];

    // 1. Scarcity Logic (Inventory Level)
    if (product.stock <= 2) {
      multiplier += 0.15;
      reasons.push("Archival Scarcity: Low Stock");
    } else if (product.stock > 15) {
      multiplier -= 0.10;
      reasons.push("Registry Optimization: High Stock");
    }

    // 2. Demand Signal (Inquiry Volume)
    if (signals.inquiryCount > 10) {
      multiplier += 0.05;
      reasons.push("Market Resonance: High Intent");
    }

    // 3. Hub Specific Adjustment
    if (country === 'ae') {
      multiplier += 0.05; // UAE Premium for high-liquidity market
      reasons.push("Regional Liquidity: UAE Hub");
    }

    // 4. Enforce Safety Rails
    const safeMultiplier = Math.min(
      1 + this.MAX_INCREASE, 
      Math.max(1 - this.MAX_DECREASE, multiplier)
    );

    const adjustedPrice = Math.round(product.basePrice * safeMultiplier);

    return {
      id: `dp_${product.id}_${Date.now()}`,
      productId: product.id,
      basePrice: product.basePrice,
      adjustedPrice,
      country,
      reason: reasons.length > 0 ? 'demand' : 'regional',
      confidenceScore: 0.92,
      updatedAt: new Date().toISOString(),
      metadata: {
        demandSignal: signals.inquiryCount,
        stockLevel: product.stock
      }
    };
  }

  /**
   * Generates a batch of pricing suggestions for the AI Dashboard.
   */
  static auditRegistryPricing(
    products: Product[],
    inquiries: PrivateInquiry[],
    country: CountryCode
  ): DynamicPrice[] {
    return products
      .filter(p => p.regions.includes(country))
      .map(p => {
        const productInquiries = inquiries.filter(i => i.productId === p.id).length;
        return this.optimizePrice(p, country, {
          inquiryCount: productInquiries,
          stockLevel: p.stock,
          hubLiquidity: 0.8 // Simulated
        });
      })
      .filter(dp => dp.adjustedPrice !== dp.basePrice); // Only return changes
  }
}
