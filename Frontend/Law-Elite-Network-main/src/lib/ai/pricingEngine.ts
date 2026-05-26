/**
 * @fileOverview PricingEngine
 * Algorithmically calculates suggested consultation fees based on demand and network reputation.
 */

export const calculateSuggestedPrice = (lawyer: any) => {
  // Base floor for elite network is 1000
  let base = lawyer.consultationFee || 1000;

  // High demand → increase price (Weighted by engagement volume)
  const totalBookings = lawyer.totalBookings || (lawyer.experience * 2); 
  if (totalBookings > 20) {
    base += 200;
  }

  // High rating → premium pricing boost
  if ((lawyer.rating || 0) >= 4.5) {
    base += 300;
  }

  // Low demand → decrease price to drive engagement velocity
  if (totalBookings < 5) {
    base -= 200;
  }

  // Minimum fee protocol for platform integrity
  if (base < 500) base = 500;

  return base;
};
