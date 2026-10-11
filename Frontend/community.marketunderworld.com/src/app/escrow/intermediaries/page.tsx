"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { SERVICE_LABEL, listIntermediaries, type Intermediary } from "@/lib/api/intermediaries";

// The directory of intermediaries an admin has approved. Everything shown comes from the database.
export default function IntermediariesPage() {
  const [items, setItems] = useState<Intermediary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState("");

  useEffect(() => {
    listIntermediaries().then((r) => setItems(r.items)).catch((e) => setError(e instanceof Error ? e.message : "Could not load the directory"));
  }, []);

  const shown = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (items ?? []).filter((i) => !q || i.displayName.toLowerCase().includes(q) || i.services.some((s) => SERVICE_LABEL[s].toLowerCase().includes(q)));
  }, [items, term]);

  return (
    <div className="max-w-6xl mx-auto p-6 text-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold">Intermediaries</h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            People who help members buy USDT, trade crypto and set up accounts. You pay the intermediary directly by scanning their QR; check the name in your app before you send.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search name or service…" aria-label="Search intermediaries"
              className="w-60 bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-red-500" />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          </div>
          <Link href="/escrow/apply-agent" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm whitespace-nowrap">Become an intermediary</Link>
        </div>
      </div>

      {error ? <p className="text-red-400">{error}</p> : items === null ? (
        <div className="flex items-center gap-3 text-zinc-400 py-16 justify-center"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
      ) : shown.length === 0 ? (
        <p className="text-center text-zinc-400 py-16">{items.length === 0 ? "No intermediaries are listed yet." : "No intermediary matches your search."}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((i) => (
            <div key={i.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between hover:border-red-500/50 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-zinc-900 flex items-center justify-center text-lg font-bold">{i.displayName.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <h3 className="font-bold">{i.displayName}</h3>
                    {i.verified && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" /> Verified{i.depositUsd > 0 ? ` · protected up to $${i.depositUsd.toLocaleString()}` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {i.services.map((s) => <span key={s} className="bg-zinc-950 text-zinc-300 border border-zinc-800 text-[10px] px-2 py-0.5 rounded">{SERVICE_LABEL[s]}</span>)}
                </div>
                <div className="space-y-1.5 text-xs text-zinc-300 mb-4">
                  {i.commissionNote && <div className="flex justify-between gap-3"><span className="text-zinc-500">Fee</span><span className="text-right">{i.commissionNote}</span></div>}
                  {i.tradeLimitUsd ? <div className="flex justify-between"><span className="text-zinc-500">Trade limit</span><span>${i.tradeLimitUsd.toLocaleString()}</span></div> : null}
                  <div className="flex justify-between"><span className="text-zinc-500">Completed trades</span><span className="font-mono">{i.completedTrades}</span></div>
                </div>
              </div>
              <Link href={`/escrow/intermediaries/${i.slug}`} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg text-center">View and request a trade</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
