'use client';

import { useAppStore } from '@/lib/store';
import { MAISON_SERVICES, MAISON_REPORTS } from '@/lib/mock-monetization';

export function useMonetization() {
  const { products, globalSettings } = useAppStore();

  // In a real system, these would come from the store/database
  const services = MAISON_SERVICES;
  const reports = MAISON_REPORTS;

  const isPriceVisible = (productId: string) => {
    // Logic can be overridden by admin or product-specific flags
    const product = products.find(p => p.id === productId);
    return product ? !product.isVip : true;
  };

  return {
    services,
    reports,
    isPriceVisible,
    settings: globalSettings.payments
  };
}
