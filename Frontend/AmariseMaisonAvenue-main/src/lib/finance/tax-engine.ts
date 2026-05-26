/**
 * @fileOverview Institutional Tax Orchestration Engine
 * Handles per-item category-level tax calculation for global markets.
 * Designed for absolute compliance across 5 jurisdictions.
 */

import { CartItem, CountryCode, TaxRule, TaxCalculationResult, TaxType } from '../types';

export class TaxEngine {
  /**
   * Orchestrates the total tax calculation for an entire acquisition bag.
   */
  static calculateOrderTax(
    items: CartItem[], 
    countryCode: CountryCode, 
    rules: TaxRule[]
  ): TaxCalculationResult {
    let subtotal = 0;
    let totalTax = 0;
    const breakdown: TaxCalculationResult['breakdown'] = [];

    items.forEach(item => {
      const itemPrice = item.basePrice * item.quantity;
      subtotal += itemPrice;

      // Find the most specific rule (Category > General)
      const rule = this.findApplicableRule(item.categoryId, countryCode, rules);
      
      const taxAmount = this.calculateItemTax(itemPrice, rule);
      totalTax += taxAmount;

      breakdown.push({
        itemId: item.id,
        itemName: item.name,
        itemPrice,
        taxAmount,
        taxRate: rule.rate,
        taxType: rule.taxType
      });
    });

    return {
      subtotal,
      totalTax,
      totalAmount: subtotal + totalTax,
      breakdown
    };
  }

  /**
   * Calculates tax for a single item delta.
   */
  private static calculateItemTax(price: number, rule: TaxRule): number {
    if (rule.isInclusive) {
      // If inclusive, tax is already in the price. 
      // Formula: Price - (Price / (1 + Rate))
      return price - (price / (1 + (rule.rate / 100)));
    } else {
      // If exclusive, tax is added on top.
      return price * (rule.rate / 100);
    }
  }

  /**
   * Strategy: Rule resolution logic.
   * Priority: Specific Category Rule > General Country Rule
   */
  private static findApplicableRule(
    categoryId: string, 
    countryCode: CountryCode, 
    rules: TaxRule[]
  ): TaxRule {
    const specificRule = rules.find(r => r.country === countryCode && r.category === categoryId);
    if (specificRule) return specificRule;

    const generalRule = rules.find(r => r.country === countryCode && r.category === 'general');
    if (generalRule) return generalRule;

    // Absolute fallback: Zero tax registry
    return {
      id: 'fallback',
      country: countryCode,
      taxType: 'VAT',
      category: 'general',
      rate: 0,
      isInclusive: false,
      lastUpdated: new Date().toISOString()
    };
  }
}
