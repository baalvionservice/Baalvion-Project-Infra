import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";

// Sits inside ProtectedRoute, so the visitor is already signed in — this only decides whether
// they may see an administration surface.
function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!user?.roles?.includes("admin")) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute><RequireAdmin>{children}</RequireAdmin></ProtectedRoute>
);
