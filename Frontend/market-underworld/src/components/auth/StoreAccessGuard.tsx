"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { listMyStores } from "@/lib/api/commerce-admin";

type AccessState = "checking" | "allowed" | "denied";

/**
 * Gates seller-facing surfaces on "does this user have RBAC access to at least one store" rather
 * than a fixed JWT role list (unlike RoleGuard) — store access is a resolved-per-store capability,
 * not a role claim, so the only correct check is asking commerce-service via the already
 * RBAC-scoped GET /stores endpoint (loadAccessScope) and seeing if it returns anything.
 */
export function StoreAccessGuard({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>("checking");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setAccess("denied");
      return;
    }
    let cancelled = false;
    listMyStores().then((stores) => {
      if (!cancelled) setAccess(stores.length > 0 ? "allowed" : "denied");
    });
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (access === "denied") router.replace("/seller/onboarding");
  }, [access, router]);

  if (authLoading || access === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508]">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#050508] text-center px-6">
        <ShieldAlert className="w-8 h-8 text-red-400" />
        <p className="text-white font-bold">No store access on this account yet.</p>
        <p className="text-gray-500 text-sm">Redirecting to seller onboarding&hellip;</p>
      </div>
    );
  }

  return <>{children}</>;
}
