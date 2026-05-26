"use client"

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, ShieldAlert } from "lucide-react";
import { reportError } from "@/lib/monitoring";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our telemetry service
    reportError(error, "Global Boundary Error");
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-rose-100">
        <div className="bg-rose-600 p-8 text-white text-center space-y-2">
          <ShieldAlert className="h-12 w-12 mx-auto mb-2" />
          <h1 className="text-2xl font-black uppercase italic tracking-tight">System Interruption</h1>
          <p className="text-rose-100 text-sm font-medium opacity-80">A secure session error has occurred.</p>
        </div>
        <div className="p-8 space-y-6 text-center">
          <p className="text-slate-600 text-sm leading-relaxed">
            Our automated integrity monitors have detected an unexpected application failure. No trade data has been compromised. Please attempt to synchronize your session.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => reset()} 
              className="bg-primary font-bold h-12 px-8 gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> Synchronize Session
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="font-bold h-12 border-slate-200"
            >
              Exit to Homepage
            </Button>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Error Digest: {error.digest || "SYS-ERR-UNK"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
