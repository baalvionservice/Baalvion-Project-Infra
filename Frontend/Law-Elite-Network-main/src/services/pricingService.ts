/**
 * @fileOverview PricingService
 * Coordinates the pricing engine with practitioner dossiers to provide real-time optimizations.
 */

import { calculateSuggestedPrice } from "@/lib/ai/pricingEngine";

export const getPricingInsights = (lawyer: any) => {
  const suggested = calculateSuggestedPrice(lawyer);
  const current = lawyer.consultationFee || 0;
  
  const totalBookings = lawyer.totalBookings || (lawyer.experience * 2);

  return {
    current,
    suggested,
    difference: suggested - current,
    demandLevel: totalBookings > 20 ? 'High' : totalBookings > 10 ? 'Medium' : 'Low',
    recommendation: suggested > current ? 'Increase for Premium Positioning' : 'Optimize for Volume'
  };
};
