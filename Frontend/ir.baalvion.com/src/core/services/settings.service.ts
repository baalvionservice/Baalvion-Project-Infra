'use client';

import { PlatformSettings } from "../content/schemas";
import { settingsApi } from "@/lib/ir-engagement";

// Live, backed by ir-service /api/v1/settings (singleton per org). No in-memory mock.
export const settingsService = {
  getSettings: async (): Promise<PlatformSettings> => {
    const s: any = await settingsApi.get();
    return {
      branding: s.branding,
      seo: s.seo,
      features: s.features,
      environment: s.environment,
    } as PlatformSettings;
  },

  updateSettings: async (updates: Partial<PlatformSettings>): Promise<void> => {
    await settingsApi.update(updates);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('settings-updated'));
  },
};
