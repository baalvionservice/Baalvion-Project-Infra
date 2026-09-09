"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

// Route-segment error boundary. It stands in for the layouts below the root, so it
// carries the skip-link target itself. Stack traces go to the console only.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[baalvion-intelligence] Unhandled application error:", error);
  }, [error]);

  return (
    <main id="main-content" className="section-container section-y">
      <div className="mx-auto max-w-xl text-center">
        <span className="eyebrow mx-auto w-fit justify-center">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          Signal interrupted
        </span>
        <h1 className="mt-6 text-[32px] md:text-[44px]">Something went wrong</h1>
        <p className="mb-8">
          This view failed to render. Nothing was lost — retry, or head back to the homepage.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
        {error?.digest ? (
          <p className="metric mt-8 text-xs uppercase tracking-[0.2em]">REF: {error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}
