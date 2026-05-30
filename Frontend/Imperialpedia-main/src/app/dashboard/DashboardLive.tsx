"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DashboardClient } from "./DashboardClient";
import { getUserDashboardData } from "@/services/data/portfolio-service";
import type { UserDashboardData } from "@/types/user-system";

/**
 * Client wrapper: fetches the signed-in user's live dashboard (watchlist + portfolio priced off
 * the live assets feed) and hands it to the existing DashboardClient. Falls back to mock data
 * (handled inside the service) when signed out / offline.
 */
export function DashboardLive() {
  const [data, setData] = useState<UserDashboardData | null>(null);

  useEffect(() => {
    let active = true;
    getUserDashboardData()
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
  return <DashboardClient data={data} />;
}
