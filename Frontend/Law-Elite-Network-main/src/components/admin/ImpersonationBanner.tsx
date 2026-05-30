"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Eye, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Global "View as" banner. Renders a fixed strip whenever an admin is impersonating
 * another user, making the impersonation impossible to miss and one click to exit.
 * Mounted in the root layout so it overlays every page (client + lawyer dashboards).
 */
export default function ImpersonationBanner() {
  const { impersonating, stopImpersonation } = useAuth();
  const router = useRouter();

  if (!impersonating) return null;

  const exit = async () => {
    await stopImpersonation();
    router.push("/admin");
  };

  const label = impersonating.name || impersonating.email || `user #${impersonating.id}`;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[120] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2.5 text-sm font-medium text-amber-950 shadow-[0_-4px_12px_rgba(0,0,0,0.12)]">
      <Eye className="h-4 w-4 shrink-0" />
      <span className="truncate">
        Viewing as <strong>{label}</strong>
        <span className="ml-1 rounded bg-amber-950/15 px-1.5 py-0.5 text-xs uppercase tracking-wide">
          {impersonating.role}
        </span>
        <span className="ml-2 hidden sm:inline text-amber-900/80">— admin impersonation, read scope is this user’s</span>
      </span>
      <button
        onClick={exit}
        className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50 transition hover:bg-amber-900"
      >
        <X className="h-3.5 w-3.5" /> Exit View as
      </button>
    </div>
  );
}
