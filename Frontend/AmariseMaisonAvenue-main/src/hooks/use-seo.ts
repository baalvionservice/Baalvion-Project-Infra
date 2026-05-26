'use client';

import { useAppStore } from '@/lib/store';
import { SEOMetadata } from '@/lib/types';

export function useSEO() {
  const { seoRegistry, upsertSEOMetadata } = useAppStore();

  const getMetadata = (path: string) => {
    return seoRegistry.find(m => m.path === path) || seoRegistry[0];
  };

  return {
    registry: seoRegistry,
    getMetadata,
    updateMetadata: upsertSEOMetadata
  };
}
