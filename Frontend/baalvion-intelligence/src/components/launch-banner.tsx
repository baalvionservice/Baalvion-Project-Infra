"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function LaunchBanner() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/billing/launch-offer", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => setRemaining(body?.data?.remaining ?? 0))
      .catch(() => setRemaining(0));
  }, []);

  if (remaining === null || remaining <= 0) return null;

  return (
    <div className="border-b border-primary/30 bg-primary/10">
      <div className="section-container flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2 text-center text-sm text-foreground">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span>
          <strong className="font-semibold">Founding-customer pricing:</strong> 50% off your first payment on
          Starter, Growth, or Pro — applied automatically at checkout,{" "}
          <strong className="font-semibold">{remaining} of 10 spots left</strong>.
        </span>
        <Link href="/pricing" className="font-semibold text-primary hover:underline">
          Claim it →
        </Link>
      </div>
    </div>
  );
}
