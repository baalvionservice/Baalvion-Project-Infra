'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';

export interface RegionData {
  id: string;
  name: string;
  revenue: number;
  activeUsers: number;
  viewing: number;
  wishlist: number;
  cart: number;
  checkout: number;
  purchased: number;
  growth: number;
  lat: number;
  lng: number;
  predictedInflow: number; // New: 1h forecast value
}

/**
 * useSimulationData: Institutional Intelligence Engine.
 * Recalibrated to simulate real-time "Incoming Money" signals.
 */
export function useSimulationData() {
  const { recordMetric } = useAppStore();
  const [regions, setRegions] = useState<Record<string, RegionData>>({
    us: { id: 'us', name: 'USA Hub', revenue: 1245000, activeUsers: 420, viewing: 250, wishlist: 80, cart: 45, checkout: 12, purchased: 124, growth: 12.4, lat: 37.0902, lng: -95.7129, predictedInflow: 42000 },
    uk: { id: 'uk', name: 'UK Hub', revenue: 842000, activeUsers: 215, viewing: 130, wishlist: 42, cart: 22, checkout: 8, purchased: 82, growth: 8.2, lat: 55.3781, lng: -3.4360, predictedInflow: 18500 },
    ae: { id: 'ae', name: 'UAE Hub', revenue: 1540000, activeUsers: 580, viewing: 340, wishlist: 110, cart: 65, checkout: 24, purchased: 156, growth: 15.6, lat: 23.4241, lng: 53.8478, predictedInflow: 85000 },
    in: { id: 'in', name: 'India Hub', revenue: 420000, activeUsers: 180, viewing: 110, wishlist: 35, cart: 18, checkout: 5, purchased: 42, growth: 22.1, lat: 20.5937, lng: 78.9629, predictedInflow: 12000 },
    sg: { id: 'sg', name: 'Singapore Hub', revenue: 620000, activeUsers: 240, viewing: 150, wishlist: 48, cart: 28, checkout: 10, purchased: 68, growth: 5.4, lat: 1.3521, lng: 103.8198, predictedInflow: 24000 },
  });

  const simulateUpdate = useCallback(() => {
    setRegions(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        const region = next[key];
        
        // 1. Base traffic fluctuation
        const userChange = Math.floor(Math.random() * 8);
        const userSign = Math.random() > 0.4 ? 1 : -1;
        region.activeUsers = Math.max(50, region.activeUsers + userChange * userSign);

        // 2. Maintain Funnel Ratios
        region.viewing = Math.floor(region.activeUsers * 0.65);
        region.wishlist = Math.max(5, Math.floor(region.viewing * 0.35) + (Math.random() > 0.8 ? 2 : 0));
        region.cart = Math.max(2, Math.floor(region.wishlist * 0.45) + (Math.random() > 0.9 ? 1 : 0));
        
        // 3. Predicted Inflow Logic: 15% of Cart Value is "Money Coming"
        const cartValue = region.cart * 15000;
        const checkoutValue = region.checkout * 25000;
        region.predictedInflow = Math.floor((cartValue * 0.12) + (checkoutValue * 0.45));

        // 4. Record Observability Metrics
        recordMetric({
          name: 'api_response_time',
          value: 40 + Math.random() * 120,
          unit: 'ms',
          source: 'System',
          country: region.id as any
        });

        recordMetric({
          name: 'payment_success_rate',
          value: 94 + Math.random() * 6,
          unit: 'percent',
          source: 'Payments',
          country: region.id as any
        });

        // 5. Purchase Event Simulation
        if (Math.random() > 0.85 && region.cart > 0) {
          const checkoutCount = Math.ceil(Math.random() * 2);
          region.checkout = Math.min(region.cart, region.checkout + checkoutCount);
          
          if (Math.random() > 0.5) {
            const purchaseValue = 5000 + Math.floor(Math.random() * 45000);
            region.revenue += purchaseValue;
            region.purchased += 1;
            region.checkout = Math.max(0, region.checkout - 1);
          }
        } else {
          region.checkout = Math.max(0, Math.floor(region.cart * 0.2));
        }
      });
      return next;
    });
  }, [recordMetric]);

  useEffect(() => {
    const interval = setInterval(simulateUpdate, 5000);
    return () => clearInterval(interval);
  }, [simulateUpdate]);

  const globalMetrics = useMemo(() => {
    const vals = Object.values(regions);
    const totalUsers = vals.reduce((acc, r) => acc + r.activeUsers, 0);
    const totalPurchased = vals.reduce((acc, r) => acc + r.purchased, 0);
    const totalViewing = vals.reduce((acc, r) => acc + r.viewing, 0);
    const totalPredicted = vals.reduce((acc, r) => acc + r.predictedInflow, 0);

    return {
      globalTotal: vals.reduce((acc, r) => acc + r.revenue, 0),
      globalUsers: totalUsers,
      totalOrders: totalPurchased,
      globalCart: vals.reduce((acc, r) => acc + r.cart, 0),
      globalWishlist: vals.reduce((acc, r) => acc + r.wishlist, 0),
      globalPredictedInflow: totalPredicted,
      conversionRate: ((totalPurchased / (totalViewing || 1)) * 100).toFixed(2)
    };
  }, [regions]);

  return {
    regions,
    ...globalMetrics
  };
}
