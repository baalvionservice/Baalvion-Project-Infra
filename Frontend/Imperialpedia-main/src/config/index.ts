export * from './env';
export * from './platform';
export * from './routes';
export * from './seo';

import { platformConfig } from './platform';
import { env } from './env';
import { seoConfig } from './seo';

/**
 * Backward compatibility for siteConfig
 */
export const siteConfig = {
  name: platformConfig.name,
  description: platformConfig.description,
  url: env.siteUrl,
  ogImage: seoConfig.openGraph.images[0].url,
  links: {
    twitter: 'https://twitter.com/imperialpedia',
    github: 'https://github.com/imperialpedia',
  },
};

export type SiteConfig = typeof siteConfig;
