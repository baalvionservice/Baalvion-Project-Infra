"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { useAuthSDK } from "@baalvion/auth-sdk/react";

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
  const router = useRouter();
  const { email, logout } = useAuthSDK();
  const segment = pathname?.split("/")[2] ?? "overview";
  const title = titles[segment] ?? "Dashboard";

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserCircle className="h-6 w-6" aria-hidden />
          {email && <span className="hidden max-w-[16ch] truncate sm:inline">{email}</span>}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </header>
  );
}
