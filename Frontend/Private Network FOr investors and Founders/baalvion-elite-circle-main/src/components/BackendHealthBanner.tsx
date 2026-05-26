import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";

export const BackendHealthBanner = () => {
  const [missing, setMissing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) setMissing(true);
  }, []);

  if (!missing || dismissed) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between gap-3 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>Backend configuration missing. Some features may not work.</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="hover:opacity-80"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
