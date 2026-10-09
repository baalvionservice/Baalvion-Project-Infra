'use client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_dummy_key', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // We'll capture pageviews manually
    opt_out_capturing_by_default: true,
  });
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
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
