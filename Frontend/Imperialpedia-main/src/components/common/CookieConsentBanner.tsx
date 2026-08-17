"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStoredConsent, setConsent, hasGlobalPrivacyControl } from "@/lib/consent";

// Gates GA/AdSense cookies behind an explicit choice (Google Consent Mode v2 --
// see Analytics.tsx's 'consent: default' call, which denies everything until this
// banner updates it). Required by Google's EU User Consent Policy for any AdSense
// publisher with EEA/UK traffic; applied to every visitor rather than trying to
// geo-detect, since under/over-detecting EEA visitors is worse than asking once.
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored === "accepted") {
      setConsent(true); // re-affirm granted state to gtag on this load
      return;
    }
    if (stored === "declined") return;

    // Global Privacy Control (https://globalprivacycontrol.org/) is a legally
    // recognized opt-out signal under CCPA/CPRA — honor it immediately instead
    // of waiting for a banner interaction, and skip showing the banner at all.
    if (hasGlobalPrivacyControl()) {
      setConsent(false);
      return;
    }

    setVisible(true);
  }, []);

  const decide = (accepted: boolean) => {
    setConsent(accepted);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies for analytics and to show relevant ads. Read our{" "}
          <Link href="/cookie-policy" className="underline underline-offset-2">
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => decide(false)}>
            Decline
          </Button>
          <Button size="sm" onClick={() => decide(true)}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
