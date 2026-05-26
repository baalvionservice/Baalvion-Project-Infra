import { PlatformConfig } from '@/types';
import { env } from './env';

/**
 * @fileOverview Global platform configuration and constants.
 * Updated for V1.0 Frontend Integration.
 */

export const platformConfig = {
  name: env.appName,
  version: '1.0 Frontend',
  description: 'The world\'s most scalable financial intelligence engine. Explore over 1,000,000 pages of deep financial insights.',
  defaultLanguage: 'en',
  defaultPaginationSize: 20,
  contactEmail: 'governance@imperialpedia.com',
  modules: [
    "Content System",
    "Learning System",
    "Market Intelligence",
    "AI Systems",
    "Community System",
    "Premium Features",
    "Platform Admin"
  ],
  estimated_nodes: "1,000,000+"
};

export type PlatformConfiguration = typeof platformConfig;
