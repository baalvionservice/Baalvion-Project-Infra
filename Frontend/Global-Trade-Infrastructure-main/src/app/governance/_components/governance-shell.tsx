/**
 * @file governance-shell.tsx
 * @description Standard command shell for all consolidated governance and oversight pages (client
 * half — split out so the route segment config in layout.tsx can live in a Server Component).
 *
 * Follows the same screen-width rules as the main dashboard shell: one full-width column below
 * 1024px (the menu opens from the top bar), and the side menu beside the content from 1024px up.
 * It used to have no one-column base, so wide admin tables stretched the whole page sideways on
 * phones and pushed the account menu off-screen.
 */
'use client';

import { DashboardHeader } from "@/app/(dashboard)/_components/header";
import { DashboardSidebar } from "@/app/(dashboard)/_components/sidebar";
import { PageHeadingFallback } from "@/components/dashboard/page-heading-fallback";

export function GovernanceShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-dvh w-full grid-cols-1 lg:grid-cols-[280px_1fr]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <DashboardSidebar />
      <div className="flex min-w-0 flex-col">
        <DashboardHeader />
        {/* Wide tables scroll inside this area instead of widening the page. */}
        <div id="main-content" tabIndex={-1} className="min-w-0 flex-1 overflow-x-auto p-4 sm:p-6 focus:outline-none">
          <PageHeadingFallback containerId="main-content" />
          {children}
        </div>
      </div>
    </div>
  )
}
