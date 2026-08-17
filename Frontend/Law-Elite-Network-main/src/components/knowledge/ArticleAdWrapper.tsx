'use client';

import React, { ReactNode } from 'react';
import { SimpleMidArticleAd } from '@/components/ads';

interface ArticleAdWrapperProps {
  /**
   * Article content HTML/JSX
   */
  children: ReactNode;

  /**
   * Word count for determining ad placement
   */
  wordCount?: number;

  /**
   * Enable ads in this article (default: true)
   */
  enableAds?: boolean;
}

/**
 * Client-side wrapper for injecting ads into articles
 * Used by ArticleView to add ads to article content
 *
 * Handles:
 * - Mid-article ad placement
 * - Responsive layout
 * - Analytics tracking
 */
export function ArticleAdWrapper({
  children,
  wordCount = 0,
  enableAds = true,
}: ArticleAdWrapperProps) {
  // Show mid-article ad if content is long enough
  const showMidArticleAd = enableAds && wordCount >= 300;

  if (!enableAds) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {showMidArticleAd && (
        <div className="my-8">
          <SimpleMidArticleAd />
        </div>
      )}
    </>
  );
}
