'use client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Without a real key there is nothing to send to, so do not start it (it only produced 404s).
if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // We'll capture pageviews manually
    opt_out_capturing_by_default: true,
  });
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    // Re-hydrate consent status on mount
    const consent = localStorage.getItem("mu_cookie_consent");
    if (consent === "granted") {
      posthog.opt_in_capturing();
    } else if (consent === "denied") {
      posthog.opt_out_capturing();
    }
    
    // Optionally capture page view manually here if we want or via a hook
    posthog.capture('$pageview');
  }, []);
  
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
