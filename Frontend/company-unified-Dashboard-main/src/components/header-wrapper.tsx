"use client";

import { Suspense } from "react";
import { Header } from "./header";

function HeaderFallback() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <div className="flex items-center gap-2 px-4">
        <div className="h-8 w-8 rounded bg-muted animate-pulse" />
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      </div>
    </header>
  );
}

export function HeaderWrapper() {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <Header />
    </Suspense>
  );
}
