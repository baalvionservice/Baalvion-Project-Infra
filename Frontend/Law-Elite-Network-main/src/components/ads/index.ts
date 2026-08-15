/**
 * Advertisement components for Law Elite Network
 * Production-ready Google AdSense integration with analytics tracking
 */

export { ResponsiveDisplayAd, type ResponsiveDisplayAdProps } from './ResponsiveDisplayAd';

export { AD_PLACEMENTS, useAdManager, useAdConsent, adManager } from './AdManager';
export type { AdPlacementKey } from './AdManager';

export { AdPlacementStrategy, SimpleMidArticleAd } from './AdPlacementStrategy';
export type { AdPlacementStrategyProps } from './AdPlacementStrategy';

export {
  AMPAdSupport,
  generateAMPAdCode,
  getAMPAnalyticsConfig,
  getAMPHtmlTemplate,
  isAMPRequest,
} from './AMPAdSupport';
export type { AMPAdConfig } from './AMPAdSupport';
