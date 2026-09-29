'use client';

import { useEffect } from 'react';

/**
 * Baalvion Unified Analytics — first-party tracker loader.
 *
 * Injects the cms-service tracker (`/api/v1/collect.js`) once, tagged with this
 * site's CMS slug. The script is served + cached by the backend, so a new site
 * gets analytics by rendering this component with its slug — no per-site tracker
 * code. Collection is additionally gated server-side by the website's
 * `config.enableAnalytics` flag, so toggling analytics in the CMS admin takes
 * effect even while this tag is present.
 */
interface UnifiedAnalyticsProps {
  /** CMS website slug (e.g. "imperialpedia"). */
  slug: string;
  /** Optional explicit CMS API base ending in /api/v1. Defaults from env. */
  baseUrl?: string;
}

function resolveBase(explicit?: string): string {
  if (explicit) return explicit.replace(/\/$/, '');
  const pub = process.env.NEXT_PUBLIC_ANALYTICS_URL || process.env.NEXT_PUBLIC_CMS_PUBLIC_URL;
  if (pub) return pub.replace(/\/public\/?$/, '').replace(/\/$/, '');
  return process.env.NODE_ENV === 'production'
    ? 'https://api.baalvion.com/api/v1'
    : 'http://localhost:3018/api/v1';
}

export default function UnifiedAnalytics({ slug, baseUrl }: UnifiedAnalyticsProps) {
  useEffect(() => {
    if (!slug || typeof document === 'undefined') return;
    if (document.querySelector('script[data-baalvion-analytics]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = `${resolveBase(baseUrl)}/collect.js`;
    s.setAttribute('data-site', slug);
    s.setAttribute('data-baalvion-analytics', slug);
    document.body.appendChild(s);
  }, [slug, baseUrl]);

  return null;
}
