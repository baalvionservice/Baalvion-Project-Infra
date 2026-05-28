import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";

// Pings the self-hosted backend (Node.js + PostgreSQL) and only warns when it is
// genuinely unreachable. Replaces the old Supabase env-var presence check.
export const BackendHealthBanner = () => {
  const [unreachable, setUnreachable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const apiBase: string =
      (import.meta as any).env?.VITE_API_URL || "http://localhost:3050/v1";
    const healthUrl = apiBase.replace(/\/v1\/?$/, "") + "/health";
    let cancelled = false;
    fetch(healthUrl)
      .then((r) => { if (!cancelled && !r.ok) setUnreachable(true); })
      .catch(() => { if (!cancelled) setUnreachable(true); });
    return () => { cancelled = true; };
  }, []);

  if (!unreachable || dismissed) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between gap-3 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>Can't reach the backend API. Make sure insiders-service is running on port 3050.</span>
      </div>
      <button onClick={() => setDismissed(true)} className="hover:opacity-80" aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
