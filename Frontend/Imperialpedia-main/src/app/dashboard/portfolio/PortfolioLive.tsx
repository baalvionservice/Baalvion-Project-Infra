"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PortfolioTrackerClient } from "./PortfolioTrackerClient";
import { getUserPortfolioData } from "@/services/data/portfolio-service";
import type { UserPortfolioData } from "@/types/user-system";

/**
 * Client wrapper: fetches the signed-in user's live portfolio + watchlists (priced off the live
 * assets feed) and hands them to the existing PortfolioTrackerClient. Mock fallback (in-service)
 * when signed out / offline.
 */
export function PortfolioLive() {
  const [data, setData] = useState<UserPortfolioData | null>(null);

  useEffect(() => {
    let active = true;
    getUserPortfolioData()
      .then((d) => active && setData(d))
      .catch(() => active && setData(null));
    return () => {
      active = false;
    };
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return <PortfolioTrackerClient data={data} />;
}
