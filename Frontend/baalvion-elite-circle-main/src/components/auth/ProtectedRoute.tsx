import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase, type AuthUser as User } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: ReactNode;
}

const isVerified = (user: User | null) => !!user?.email_verified;

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64 mt-4" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isVerified(user) && location.pathname !== "/auth/verify-email") {
    return <Navigate to="/auth/verify-email" replace state={{ email: user.email }} />;
  }

  return <>{children}</>;
};
