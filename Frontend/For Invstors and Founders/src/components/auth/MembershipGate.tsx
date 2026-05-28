import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import MainLayout from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";

// Gates members-only pages (Investors, Deals, Founders) behind an active paid
// membership. Sits inside ProtectedRoute, so the user is already authenticated.
export const MembershipGate = ({ children }: { children: ReactNode }) => {
  const { active, loading } = useMembership();

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-5xl space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid sm:grid-cols-2 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
        </div>
      </MainLayout>
    );
  }
  if (!active) return <Navigate to="/membership" replace />;
  return <>{children}</>;
};
