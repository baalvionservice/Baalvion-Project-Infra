'use client';

import { useAppStore } from '@/lib/store';
import { useParams } from 'next/navigation';
import { CountryCode } from '@/lib/types';

export function useGlobalConfig() {
  const { 
    countryConfigs, 
    brandConfigs, 
    activeBrandId, 
    setCountryEnabled, 
    updateCountryConfig,
    setActiveBrand 
  } = useAppStore();
  
  const { country } = useParams();
  const activeCountryCode = (country as CountryCode) || 'us';

  const activeCountryConfig = countryConfigs.find(c => c.code === activeCountryCode) || countryConfigs[0];
  const activeBrandConfig = brandConfigs.find(b => b.id === activeBrandId) || brandConfigs[0];

  return {
    countries: countryConfigs,
    brands: brandConfigs,
    activeCountry: activeCountryConfig,
    activeBrand: activeBrandConfig,
    activeBrandId,
    setCountryEnabled,
    updateCountryConfig,
    setActiveBrand
  };
}
