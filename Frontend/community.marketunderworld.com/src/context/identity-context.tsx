"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserIdentity } from '@/lib/types';
import { REGIONS } from '@/data/mockData';

interface IdentityContextType {
  identity: UserIdentity | null;
  isGlobalView: boolean;
  setGlobalView: (val: boolean) => void;
  isLoading: boolean;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [isGlobalView, setGlobalView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate Global Identity Detection
    const detectIdentity = async () => {
      setIsLoading(true);
      
      // Artificial delay for "Scanning Node" effect
      await new Promise(resolve => setTimeout(resolve, 1200));

      const randomRegion = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      const randomCountry = (randomRegion.countries ?? [])[Math.floor(Math.random() * (randomRegion.countries?.length ?? 0))];

      const mockIdentity: UserIdentity = {
        ip: `103.24.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        country: randomCountry,
        countryCode: randomCountry.substring(0, 2).toUpperCase(),
        region: randomRegion.name,
        regionId: randomRegion.id,
        city: "Intelligence Node Central",
        language: "English / " + (randomRegion.id === 'sas' ? 'Hindi' : randomRegion.id === 'mena' ? 'Arabic' : 'Local'),
        timezone: "GMT " + (Math.random() > 0.5 ? "+" : "-") + Math.floor(Math.random() * 12),
        detectedAt: new Date().toISOString()
      };

      setIdentity(mockIdentity);
      setIsLoading(false);
    };

    detectIdentity();
  }, []);

  return (
    <IdentityContext.Provider value={{ identity, isGlobalView, setGlobalView, isLoading }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
}
