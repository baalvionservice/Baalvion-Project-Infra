"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import appsData from "@/lib/data/apps.json";

const allCategories = [
  "All",
  ...Array.from(new Set(appsData.map((app) => app.category))),
];

const sidebarNav = [
  { href: "/marketplace/installed", label: "My Installed Apps" },
  { href: "#", label: "Submit Your App" },
];

function MarketplaceSidebarContent() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "All";

  return (
    <div className="space-y-6 sticky top-20">
      <div>
        <h3 className="text-sm font-semibold mb-2 px-2">Categories</h3>
        <nav className="flex flex-col gap-1">
          {allCategories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              className={cn(
                "justify-start",
                activeCategory === category &&
                  "bg-accent text-accent-foreground"
              )}
            >
              {category}
            </Button>
          ))}
        </nav>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2 px-2">Manage</h3>
        <nav className="flex flex-col gap-1">
          {sidebarNav.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="justify-start"
              asChild
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function MarketplaceSidebarFallback() {
  return (
    <div className="space-y-6 sticky top-20">
      <div>
        <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2 px-2" />
        <nav className="flex flex-col gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-full bg-muted animate-pulse rounded"
            />
          ))}
        </nav>
      </div>
      <div>
        <div className="h-4 w-16 bg-muted animate-pulse rounded mb-2 px-2" />
        <nav className="flex flex-col gap-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-full bg-muted animate-pulse rounded"
            />
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function MarketplaceSidebar() {
  return (
    <Suspense fallback={<MarketplaceSidebarFallback />}>
      <MarketplaceSidebarContent />
    </Suspense>
  );
}
