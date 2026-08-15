'use client';

import React, { ReactNode } from 'react';
import { ResponsiveDisplayAd } from './ResponsiveDisplayAd';
import { AD_PLACEMENTS } from './AdManager';

export interface AdPlacementStrategyProps {
  /**
   * The article or content HTML/text
   * Used to determine optimal ad placement
   */
  content?: string | ReactNode;

  /**
   * Word count threshold for inserting mid-article ads
   * Default: 300 words minimum for mid-article ad
   */
  minWordsForMidArticleAd?: number;

  /**
   * Enable sidebar ads (if layout supports it)
   */
  enableSidebarAds?: boolean;

  /**
   * Enable footer ads
   */
  enableFooterAds?: boolean;

  /**
   * Enable mobile interstitial ads
   */
  enableMobileInterstitial?: boolean;

  /**
   * Callback when ads are placed
   */
  onPlacementComplete?: () => void;

  /**
   * Children components that will have ads injected
   */
  children?: ReactNode;
}

/**
 * AdPlacementStrategy manages the strategic placement of ads throughout the page
 *
 * This component implements Google AdSense best practices:
 * - Mid-article ads after enough content (300+ words)
 * - Sidebar ads on desktop layouts
 * - Footer ads for additional monetization
 * - Responsive and mobile-optimized
 * - Respects user consent preferences
 *
 * @example
 * ```tsx
 * <AdPlacementStrategy
 *   content={articleText}
 *   minWordsForMidArticleAd={300}
 *   enableSidebarAds={true}
 * >
 *   <ArticleContent />
 * </AdPlacementStrategy>
 * ```
 */
export function AdPlacementStrategy({
  content,
  minWordsForMidArticleAd = 300,
  enableSidebarAds = true,
  enableFooterAds = true,
  enableMobileInterstitial = false,
  onPlacementComplete,
  children,
}: AdPlacementStrategyProps) {
  // Calculate word count to determine if mid-article ad should show
  const getWordCount = (): number => {
    if (!content) return 0;
    if (typeof content === 'string') {
      return content.split(/\s+/).length;
    }
    return 0;
  };

  const wordCount = getWordCount();
  const shouldShowMidArticleAd = wordCount >= minWordsForMidArticleAd;

  React.useEffect(() => {
    onPlacementComplete?.();
  }, [onPlacementComplete]);

  return (
    <div className="ad-placement-strategy">
      {/* Mid-Article Ad - After enough content */}
      {shouldShowMidArticleAd && (
        <div className="ad-mid-article">
          <ResponsiveDisplayAd
            slotId={AD_PLACEMENTS.MID_ARTICLE.slotId}
            placement="mid-article"
            format="auto"
            fullWidthResponsive={true}
            minHeight="280px"
          />
        </div>
      )}

      {/* Main content with children */}
      <div className="ad-content-wrapper">{children}</div>

      {/* Sidebar Ads - Desktop only */}
      {enableSidebarAds && (
        <aside className="ad-sidebar hidden md:block">
          <div className="ad-sidebar-top">
            <ResponsiveDisplayAd
              slotId={AD_PLACEMENTS.SIDEBAR_TOP.slotId}
              placement="sidebar-top"
              format="vertical"
              minHeight="600px"
            />
          </div>

          <div className="ad-sidebar-bottom mt-8">
            <ResponsiveDisplayAd
              slotId={AD_PLACEMENTS.SIDEBAR_BOTTOM.slotId}
              placement="sidebar-bottom"
              format="vertical"
              minHeight="600px"
            />
          </div>
        </aside>
      )}

      {/* Footer Ad */}
      {enableFooterAds && (
        <footer className="ad-footer mt-12 pt-8 border-t border-gray-200">
          <ResponsiveDisplayAd
            slotId={AD_PLACEMENTS.FOOTER.slotId}
            placement="footer"
            format="horizontal"
            fullWidthResponsive={true}
            minHeight="100px"
          />
        </footer>
      )}

      {/* Mobile Interstitial - Mobile only, hidden by default */}
      {enableMobileInterstitial && (
        <div className="ad-mobile-interstitial md:hidden fixed bottom-0 left-0 right-0 z-40">
          <ResponsiveDisplayAd
            slotId={AD_PLACEMENTS.MOBILE_INTERSTITIAL.slotId}
            placement="mobile-interstitial"
            format="auto"
            minHeight="250px"
          />
        </div>
      )}

      <style jsx>{`
        .ad-placement-strategy {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .ad-placement-strategy {
            grid-template-columns: 1fr 300px;
            gap: 2rem;
          }
        }

        .ad-content-wrapper {
          grid-column: 1;
        }

        .ad-sidebar {
          grid-column: 2;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          position: sticky;
          top: 2rem;
          max-height: calc(100vh - 4rem);
          overflow-y: auto;
        }

        .ad-mid-article {
          margin: 2rem 0;
          padding: 1rem 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .ad-footer {
          grid-column: 1 / -1;
          text-align: center;
        }

        .ad-mobile-interstitial {
          background: rgba(0, 0, 0, 0.5);
          padding: 1rem;
          border-radius: 8px 8px 0 0;
        }
      `}</style>
    </div>
  );
}

/**
 * Simplified ad placer - just the mid-article ad
 * Use this when you only want basic ad placement
 */
export function SimpleMidArticleAd({
  slotId = AD_PLACEMENTS.MID_ARTICLE.slotId,
  placement = 'mid-article',
}) {
  return (
    <div className="my-8 py-4 border-y border-gray-200">
      <ResponsiveDisplayAd
        slotId={slotId}
        placement={placement}
        format="auto"
        fullWidthResponsive={true}
        minHeight="280px"
      />
    </div>
  );
}
