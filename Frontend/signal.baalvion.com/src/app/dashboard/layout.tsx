"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@baalvion/auth-sdk/react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <ProtectedRoute loadingFallback={<DashboardLoading />} onRedirect={(next) => router.replace(`/login?next=${encodeURIComponent(next)}`)}>
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar />
          <main id="main-content" className="flex-1 overflow-x-hidden bg-background p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
