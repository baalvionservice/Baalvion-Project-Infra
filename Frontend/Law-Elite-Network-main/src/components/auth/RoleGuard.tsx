
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

/**
 * @fileOverview RoleGuard
 * Enforces role-based access control for elite network functionalities.
 */
export default function RoleGuard({
  children,
  allowedRoles,
}: RoleGuardProps) {
  const { role, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  const isAllowed = role && allowedRoles.includes(role);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Handled by ProtectedRoute
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel p-12 rounded-3xl border-red-500/20 text-center space-y-6 shadow-2xl animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="font-headline text-3xl italic text-white leading-tight">Access Restricted</h2>
            <p className="text-muted-foreground text-sm italic">Your current professional standing does not authorize access to this module.</p>
          </div>
          <div className="pt-4">
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-8 font-bold uppercase text-[10px] tracking-widest h-12">
              <Link href="/dashboard">Return to Secure Command</Link>
            </Button>
          </div>
          <p className="text-[8px] text-muted-foreground/40 uppercase tracking-tighter pt-4 border-t border-white/5">
            Security Event Logged • {new Date().toISOString()}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
