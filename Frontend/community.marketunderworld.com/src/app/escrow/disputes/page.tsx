"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { listTrades, type Trade } from "@/lib/api/intermediaries";

export default function DisputesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [trades, setTrades] = useState<Trade[] | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/auth/signin?redirect=/escrow/disputes"); return; }
    listTrades().then((r) => setTrades(r.items.filter((t) => t.status === "disputed" || t.resolutionNote))).catch(() => setTrades([]));
  }, [authLoading, isAuthenticated, router]);

  return (
    <div className="max-w-3xl mx-auto p-6 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Disputes</h1>
      <p className="text-zinc-400 text-sm mb-8">If a trade goes wrong, open it from <Link href="/escrow/my-trades" className="text-red-400 hover:underline">My trades</Link> and press &ldquo;Raise a dispute&rdquo;. An admin reads the chat and screenshots and records a decision here.</p>
      {trades === null ? <div className="py-12 flex justify-center text-zinc-400"><Loader2 className="w-5 h-5 animate-spin" /></div> : trades.length === 0 ? (
        <p className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">You have no disputes.</p>
      ) : (
        <div className="space-y-3">
          {trades.map((t) => (
            <Link key={t.id} href={`/escrow/my-trades?trade=${t.id}`} className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 text-sm">
              <div className="flex justify-between"><span className="font-mono">{t.ref}</span><span className={t.status === "disputed" ? "text-red-400" : "text-zinc-400"}>{t.status === "disputed" ? "under review" : `resolved: ${t.status}`}</span></div>
              {t.disputeReason && <p className="text-xs text-zinc-400 mt-1">{t.disputeReason}</p>}
              {t.resolutionNote && <p className="text-xs text-zinc-300 mt-1">Admin decision: {t.resolutionNote}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
