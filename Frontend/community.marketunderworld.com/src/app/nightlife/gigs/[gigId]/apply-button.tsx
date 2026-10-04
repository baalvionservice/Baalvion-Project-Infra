"use client"

import { useState } from "react";
import Link from "next/link";
import { gigs, ApiError } from "@/lib/api/gigs";

export function ApplyButton({ gigId, open }: { gigId: string; open: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<{ message: string; code?: string; status?: number } | null>(null);

  const apply = async () => {
    setError(null);
    setState("sending");
    try {
      await gigs.apply(gigId);
      setState("done");
    } catch (err) {
      setState("idle");
      setError(err instanceof ApiError ? { message: err.message, code: err.code, status: err.status } : { message: "Could not apply. Please try again." });
    }
  };

  if (!open) {
    return <div className="w-full h-14 rounded-xl bg-white/5 text-gray-500 font-bold flex items-center justify-center">This gig is closed</div>;
  }
  if (state === "done") {
    return (
      <div className="text-center space-y-2">
        <div className="w-full h-14 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold flex items-center justify-center">Application sent</div>
        <Link href="/nightlife/candidate" className="text-xs text-gray-400 underline">Track it on your dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={apply} disabled={state === "sending"} className="w-full h-14 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-60 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(217,70,239,0.3)]">
        {state === "sending" ? "Sending…" : "Apply for Gig"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-400 text-center">
          {error.message}{" "}
          {error.status === 401 && <Link href={`/auth/signin?redirect=${encodeURIComponent(`/nightlife/gigs/${gigId}`)}`} className="underline font-bold">Sign in</Link>}
          {(error.code === "PROFILE_REQUIRED" || error.code === "PROFILE_NOT_VERIFIED") && <Link href="/nightlife/candidate" className="underline font-bold">Open your profile</Link>}
        </p>
      )}
    </div>
  );
}
