"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { SERVICE_LABEL, listTrades, myIntermediary, setMyFee, type OwnIntermediary, type Trade } from "@/lib/api/intermediaries";
import { useToast } from "@/hooks/use-toast";

// The intermediary's own view: requests from customers, payments to check, and completed trades.
export default function AgentDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [me, setMe] = useState<OwnIntermediary | null | undefined>(undefined);
  const [trades, setTrades] = useState<Trade[]>([]);
  const { toast } = useToast();
  const [fee, setFee] = useState<string | null>(null);
  const [savingFee, setSavingFee] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/auth/signin?redirect=/escrow/agent-dashboard"); return; }
    const load = () => {
      myIntermediary().then((r) => setMe(r.intermediary)).catch(() => setMe(null));
      listTrades().then((r) => setTrades(r.items.filter((t) => t.role === "intermediary"))).catch(() => {});
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [authLoading, isAuthenticated, router]);

  if (me === undefined) return <div className="p-24 flex justify-center text-zinc-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (!me || me.status !== "active") {
    return (
      <div className="max-w-3xl mx-auto p-6 text-white min-h-screen text-center py-24">
        <h1 className="text-2xl font-bold mb-2">Intermediary tools</h1>
        <p className="text-zinc-400 mb-6">{me ? "Your application is not active yet." : "You are not listed as an intermediary."}</p>
        <Link href="/escrow/apply-agent" className="text-red-400 hover:underline">{me ? "See your application" : "Apply to become an intermediary"}</Link>
      </div>
    );
  }

  const feeValue = fee ?? (me.feePercent === null || me.feePercent === undefined ? "" : String(me.feePercent));
  const saveFee = async () => {
    setSavingFee(true);
    try {
      const n = feeValue.trim() === "" ? null : Number(feeValue);
      if (n !== null && (!Number.isFinite(n) || n < 0 || n > 20)) throw new Error("Enter a fee between 0 and 20 percent, or leave it empty.");
      const next = await setMyFee(n);
      setMe({ ...me, feePercent: next.feePercent }); setFee(null);
      toast({ title: "Fee saved", description: n === null ? "You will send each customer a price in the trade chat." : `Customers now see ${n}% and a calculated total.` });
    } catch (e) { toast({ variant: "destructive", title: "Couldn't save", description: e instanceof Error ? e.message : "Please try again." }); } finally { setSavingFee(false); }
  };
  const active = trades.filter((t) => ["created", "payment_submitted", "in_progress"].includes(t.status)).length;
  const toCheck = trades.filter((t) => t.status === "payment_submitted").length;
  const done = trades.filter((t) => t.status === "completed").length;
  const disputed = trades.filter((t) => t.status === "disputed").length;

  return (
    <div className="max-w-5xl mx-auto p-6 text-white min-h-screen">
      <div className="mb-8 border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold mb-1 text-red-500">Intermediary tools</h1>
        <p className="text-gray-400 text-sm">Signed in as <strong className="text-white">{me.displayName}</strong>. <Link href={`/escrow/intermediaries/${me.slug}`} className="text-red-400 hover:underline">View my public page</Link></p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8 space-y-3">
        <h2 className="font-bold">Your fee</h2>
        <p className="text-sm text-zinc-400">Set a percentage and every customer sees the full calculation (amount, today&apos;s price, your fee, total) and can lock it themselves. Leave it empty to send each customer a price in the trade chat instead.</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center"><input value={feeValue} onChange={(e) => setFee(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Fee percent" placeholder="e.g. 2" className="w-28 bg-zinc-950 border border-zinc-800 rounded-l-lg p-2.5 text-sm" /><span className="h-[42px] px-3 flex items-center rounded-r-lg bg-zinc-800 border border-zinc-800 text-sm">%</span></div>
          <button onClick={saveFee} disabled={savingFee} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-5 py-2.5 rounded-lg text-sm font-bold">{savingFee ? "Saving…" : "Save fee"}</button>
          <span className="text-xs text-zinc-500">{me.feePercent === null || me.feePercent === undefined ? "Currently: you quote each trade in the chat." : `Currently: ${me.feePercent}%`}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[["Active", active, ""], ["Payments to check", toCheck, "text-yellow-500"], ["Completed", done, "text-green-500"], ["In dispute", disputed, "text-red-400"]].map(([label, n, c]) => (
          <div key={label as string} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
            <div className="text-gray-400 text-xs uppercase mb-1">{label}</div>
            <div className={`text-2xl font-bold ${c}`}>{n}</div>
          </div>
        ))}
      </div>
      {trades.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-zinc-400">No trade requests yet. They appear here when a customer starts one with you.</div>
      ) : (
        <div className="space-y-3">
          {trades.map((t) => (
            <Link key={t.id} href={`/escrow/my-trades?trade=${t.id}`} className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="font-mono text-white">{t.ref}</span>
                <span className={t.status === "payment_submitted" ? "text-yellow-400 font-bold" : "text-zinc-400"}>{t.status === "payment_submitted" ? "check payment" : t.status.replace(/_/g, " ")}</span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">{SERVICE_LABEL[t.serviceType]}{t.amountUsdt ? ` · ${t.amountUsdt} USDT` : ""} · updated {new Date(t.updatedAt).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
