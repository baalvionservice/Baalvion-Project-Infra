"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle } from "lucide-react";

const titles: Record<string, string> = {
  overview: "Overview",
  explorer: "News Explorer",
  trends: "Trends",
  entities: "Entities",
  alerts: "Alerts",
  "api-keys": "API",
  usage: "Usage",
  billing: "Billing",
  settings: "Settings",
};

export function DashboardTopbar() {
  const pathname = usePathname();
  const segment = pathname?.split("/")[2] ?? "overview";
  const title = titles[segment] ?? "Dashboard";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to site
        </Link>
        <UserCircle className="h-7 w-7 text-muted-foreground" aria-hidden />
      </div>
    </header>
  );
}
