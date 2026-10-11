"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AGENTS, getStoredTrades } from "@/lib/escrow-store";
import type { ServiceRequest } from "@/lib/escrow-types";

// Everything here is read from the real listing and the trades this browser holds. No sample rows,
// no estimated balances: an empty list means there is nothing to show yet.
export default function AdminDashboardPage() {
  const [trades, setTrades] = useState<ServiceRequest[]>([]);
  useEffect(() => { setTrades(getStoredTrades()); }, []);
  const disputed = trades.filter((t) => t.status === "disputed");

  return (
    <div className="max-w-5xl mx-auto p-6 text-white min-h-screen">
      <div className="mb-8 border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-red-500" /> Intermediary oversight
        </h1>
        <p className="text-gray-400 text-sm mt-1">The intermediaries who are listed, the trades requested through them, and disputes raised.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="text-zinc-400 text-xs uppercase font-semibold mb-1">Listed intermediaries</div>
          <div className="text-3xl font-bold text-emerald-400">{AGENTS.length}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="text-zinc-400 text-xs uppercase font-semibold mb-1">Trade requests</div>
          <div className="text-3xl font-bold text-white">{trades.length}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="text-zinc-400 text-xs uppercase font-semibold mb-1">Open disputes</div>
          <div className="text-3xl font-bold text-red-400">{disputed.length}</div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-3">Listed intermediaries</h2>
      <div className="space-y-3 mb-10">
        {AGENTS.map((a) => (
          <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap justify-between gap-3 text-sm">
            <div>
              <div className="font-bold text-white">{a.name}</div>
              <div className="text-xs text-zinc-400">Listed since {a.verificationDate} · {a.completedJobs} completed trades · {a.approvalStatus}</div>
            </div>
            <Link href={`/escrow/intermediaries/${a.id}`} className="text-red-400 hover:underline text-xs self-center">View page</Link>
          </div>
        ))}
        {AGENTS.length === 0 && <p className="text-zinc-400 text-sm">No intermediaries are listed.</p>}
      </div>

      <h2 className="text-lg font-bold mb-3">Disputes</h2>
      {disputed.length === 0 ? (
        <p className="text-zinc-400 text-sm">No open disputes.</p>
      ) : (
        <div className="space-y-3">
          {disputed.map((t) => (
            <Link key={t.id} href={`/escrow/my-trades?tradeId=${t.id}`} className="block bg-zinc-900 border border-red-900/50 rounded-xl p-4 text-sm">
              <span className="font-mono">{t.id}</span> · {t.memberName} · {t.amount} USDT
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
