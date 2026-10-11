"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  SERVICE_LABEL, adminApplication, adminApplications, adminTrade, adminTradeProofs, adminTrades, resolveTrade,
  type AdminApplication, type Trade, type TradeDetail, type TradeProofImage,
} from "@/lib/api/intermediaries";

// Admin-only: the API refuses everyone else, so a non-admin sees the error and no data.
export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [apps, setApps] = useState<AdminApplication[] | null>(null);
  const [disputes, setDisputes] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<AdminApplication | null>(null);
  const [trade, setTrade] = useState<TradeDetail | null>(null);
  const [shots, setShots] = useState<TradeProofImage[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminApplications().then(setApps).catch((e) => setError(e instanceof Error ? e.message : "Not allowed"));
    adminTrades("disputed").then((r) => setDisputes(r.items)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const openTrade = async (id: string) => {
    setTrade(await adminTrade(id)); setShots(await adminTradeProofs(id)); setNote("");
  };
  const decide = async (outcome: "completed" | "cancelled") => {
    if (!trade) return;
    setBusy(true);
    try { await resolveTrade(trade.id, outcome, note.trim()); toast({ title: `Dispute resolved as ${outcome}` }); setTrade(null); load(); }
    catch (e) { toast({ variant: "destructive", title: "Couldn't resolve", description: e instanceof Error ? e.message : "Try again." }); }
    finally { setBusy(false); }
  };

  if (error) return <div className="max-w-3xl mx-auto p-6 text-white min-h-screen py-24 text-center"><h1 className="text-2xl font-bold mb-2">Intermediary oversight</h1><p className="text-zinc-400">{error}</p></div>;
  if (!apps) return <div className="p-24 flex justify-center text-zinc-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto p-6 text-white min-h-screen">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-1"><ShieldCheck className="w-8 h-8 text-red-500" /> Intermediary oversight</h1>
      <p className="text-gray-400 text-sm mb-8">Approve intermediaries by confirming their deposit at <Link href="/admin/seller-payments" className="text-red-400 hover:underline">Seller Payments</Link>; they are listed the moment you confirm it.</p>

      <h2 className="text-lg font-bold mb-3">Intermediaries and applications</h2>
      <div className="space-y-3 mb-10">
        {apps.length === 0 && <p className="text-zinc-400 text-sm">No applications yet.</p>}
        {apps.map((a) => (
          <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <div>
                <div className="font-bold">{a.displayName}{a.verified ? <span className="ml-2 text-emerald-400 text-xs">verified</span> : null}</div>
                <div className="text-xs text-zinc-400">{a.status.replace(/_/g, " ")} · {a.services.map((s) => SERVICE_LABEL[s]).join(", ")} · applied {new Date(a.createdAt).toLocaleDateString()}</div>
              </div>
              <button onClick={async () => setOpen(open?.id === a.id ? null : await adminApplication(a.id))} className="text-red-400 hover:underline text-xs self-center">{open?.id === a.id ? "Hide QR codes" : "Review QR codes"}</button>
            </div>
            {open?.id === a.id && (
              <div className="mt-4 flex flex-wrap gap-4">
                {(open.qrImages ?? []).map((q) => (
                  <div key={q.id} className="space-y-1">
                    <p className="text-xs font-bold">{q.label}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={q.dataUrl} alt={`${a.displayName} ${q.label} QR`} className="w-44 h-44 object-contain bg-white rounded-md border border-zinc-800" />
                  </div>
                ))}
                {open.bio && <p className="text-sm text-zinc-300 basis-full whitespace-pre-line">{open.bio}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-3">Open disputes ({disputes.length})</h2>
      <div className="space-y-3">
        {disputes.length === 0 && <p className="text-zinc-400 text-sm">No open disputes.</p>}
        {disputes.map((t) => (
          <button key={t.id} onClick={() => void openTrade(t.id)} className="w-full text-left bg-zinc-900 border border-red-900/50 rounded-xl p-4 text-sm hover:border-red-500">
            <span className="font-mono">{t.ref}</span> · {t.intermediary.name} · {t.amountUsdt ? `${t.amountUsdt} USDT · ` : ""}{t.disputeReason}
          </button>
        ))}
      </div>

      {trade && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 my-8">
            <h2 className="text-xl font-bold">{trade.ref} · {trade.intermediary.name}</h2>
            <p className="text-sm text-red-300">Dispute: {trade.disputeReason}</p>
            <div className="max-h-56 overflow-y-auto space-y-2 bg-zinc-950 border border-zinc-800 rounded-lg p-3">
              {trade.messages.map((m) => <div key={m.id} className="text-sm"><span className="text-zinc-500 text-xs">{m.senderRole} · {new Date(m.createdAt).toLocaleString()}</span><div className="whitespace-pre-line">{m.body}</div></div>)}
            </div>
            <div className="flex flex-wrap gap-3">{shots.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={p.dataUrl} alt={`Screenshot from the ${p.uploaderRole}`} className="h-32 rounded-md border border-zinc-700" />
            ))}</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} placeholder="Your decision and why (shown to both sides)" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm" />
            <div className="flex justify-end gap-3 flex-wrap">
              <button onClick={() => setTrade(null)} className="px-4 py-2 text-sm text-zinc-400">Close</button>
              <button disabled={busy || note.trim().length < 3} onClick={() => void decide("cancelled")} className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 px-4 py-2 rounded-lg text-sm font-bold">Resolve as cancelled</button>
              <button disabled={busy || note.trim().length < 3} onClick={() => void decide("completed")} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 px-4 py-2 rounded-lg text-sm font-bold">Resolve as completed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
