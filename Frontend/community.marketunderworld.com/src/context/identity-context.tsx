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

interface GeoResponse {
  ip: string | null;
  countryCode: string | null;
  state: string | null;
  city: string | null;
  timezone: string | null;
  isp: string | null;
}

// The region lists in mockData spell a few countries differently from Intl.
const COUNTRY_ALIASES: Record<string, string> = { 'United Arab Emirates': 'UAE' };

function countryName(code: string): string {
  let name = code;
  try {
    name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) ?? code;
  } catch {
    // keep the code
  }
  return COUNTRY_ALIASES[name] ?? name;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [isGlobalView, setGlobalView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Location comes from the edge (/api/geo): country plus state/region where known.
    const detectIdentity = async () => {
      setIsLoading(true);
      
      let geo: GeoResponse | null = null;
      try {
        const res = await fetch('/api/geo', { cache: 'no-store' });
        if (res.ok) geo = await res.json();
      } catch {
        // Offline or blocked: fall through to the global view.
      }

      if (!geo?.countryCode) {
        setIdentity(null);
        setIsLoading(false);
        return;
      }

      const country = countryName(geo.countryCode);
      const region = REGIONS.find((r) => (r.countries ?? []).includes(country));
      const realIp = geo.ip ?? '';

      const mockIdentity: UserIdentity = {
        ip: realIp,
        country,
        countryCode: geo.countryCode.toUpperCase(),
        region: region?.name ?? country,
        regionId: region?.id ?? '',
        city: geo.city ?? '',
        state: geo.state ?? undefined,
        isp: geo.isp ?? undefined,
        language: navigator.language || 'English',
        timezone: geo.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        detectedAt: new Date().toISOString()
      };

      setIdentity(mockIdentity);
      setIsLoading(false);

      // Track the visitor in the background
      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip: realIp,
            country: mockIdentity.country,
            region: mockIdentity.region,
            userAgent: navigator.userAgent,
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            path: window.location.pathname
          })
        });
      } catch (e) {
        console.warn('Failed to track visitor', e);
      }
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
