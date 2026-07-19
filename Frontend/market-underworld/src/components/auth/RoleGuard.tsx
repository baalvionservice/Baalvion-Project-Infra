"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface RoleGuardProps {
  allow: string[];
  children: React.ReactNode;
}

/**
 * Client-side gate for role-restricted surfaces (admin/seller layouts). No middleware.ts exists
 * in this app, so nothing else stops these routes from rendering for an unauthenticated or
 * wrong-role visitor — this is the first enforcement point. It mirrors the platform-role check
 * commerce-service/order-service already do server-side (requirePlatformAdmin: super_admin |
 * country_admin), so every write the gated pages trigger is still independently enforced by the
 * backend even if this check were ever bypassed client-side.
 */
export function RoleGuard({ allow, children }: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const allowed = isAuthenticated && !!user && user.roles.some((role) => allow.includes(role));

  useEffect(() => {
    if (isLoading) return;
    if (!allowed) router.replace("/auth/signin");
  }, [isLoading, allowed, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508]">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#050508] text-center px-6">
        <ShieldAlert className="w-8 h-8 text-red-400" />
        <p className="text-white font-bold">You don&apos;t have access to this area.</p>
        <p className="text-gray-500 text-sm">Redirecting to sign in&hellip;</p>
      </div>
    );
  }

  return <>{children}</>;
}
