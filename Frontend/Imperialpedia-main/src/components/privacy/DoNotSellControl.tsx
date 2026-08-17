"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Text } from "@/design-system/typography/text";
import { getStoredConsent, setConsent, hasGlobalPrivacyControl } from "@/lib/consent";

/**
 * Self-service "Do Not Sell or Share My Personal Information" control
 * (CCPA/CPRA §1798.135). Uses the same consent state as the cookie banner —
 * declining here revokes ad_storage/ad_user_data/ad_personalization/
 * analytics_storage via Google Consent Mode v2, the same effect as pressing
 * "Decline" on the cookie banner or sending a Global Privacy Control signal.
 */
export function DoNotSellControl() {
  const [status, setStatus] = useState<"accepted" | "declined" | "unset" | null>(null);

  useEffect(() => {
    setStatus(getStoredConsent() ?? (hasGlobalPrivacyControl() ? "declined" : "unset"));
  }, []);

  const optOut = () => {
    setConsent(false);
    setStatus("declined");
  };

  return (
    <div className="not-prose rounded-lg border border-border bg-muted/30 p-6 space-y-3">
      <Text variant="body" className="text-muted-foreground leading-relaxed">
        {status === "declined" && "You are currently opted out of the sale/sharing of personal information for advertising purposes on this site."}
        {status === "accepted" && "You have not opted out. Selecting the button below opts you out of the sale/sharing of personal information for advertising purposes."}
        {status === "unset" && "Selecting the button below opts you out of the sale/sharing of personal information for advertising purposes on this site."}
        {status === null && " "}
      </Text>
      <Button
        type="button"
        variant={status === "declined" ? "outline" : "default"}
        disabled={status === "declined"}
        onClick={optOut}
      >
        {status === "declined" ? "Opted out" : "Do Not Sell or Share My Personal Information"}
      </Button>
    </div>
  );
}
