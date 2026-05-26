import { PlatformSettings } from "../content/schemas";

let currentSettings: PlatformSettings = {
  branding: {
    companyName: 'Baalvion',
    logoUrl: '/logo.png'
  },
  seo: {
    defaultTitle: 'Baalvion | Institutional Investor Relations',
    defaultDescription: 'The next generation of B2B trade infrastructure.'
  },
  features: {
    enableRegistration: true,
    enableDataRoomWatermark: true,
    maintenanceMode: false,
    freezePublishing: false
  },
  environment: 'mock'
};

export const settingsService = {
  getSettings: async (): Promise<PlatformSettings> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { ...currentSettings };
  },

  updateSettings: async (updates: Partial<PlatformSettings>): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    currentSettings = { ...currentSettings, ...updates };
    window.dispatchEvent(new Event('settings-updated'));
  },

  resetSettings: () => {
    localStorage.removeItem('platform_settings');
    window.location.reload();
  }
};
