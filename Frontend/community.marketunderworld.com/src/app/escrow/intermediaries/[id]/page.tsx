"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { HowItWorks } from "@/components/payments/how-it-works";
import { SERVICE_LABEL, createTrade, getIntermediary, qrUrl, type Intermediary, type ServiceType } from "@/lib/api/intermediaries";

export default function IntermediaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState<Intermediary | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [service, setService] = useState<ServiceType>("buy_usdt");
  const [amount, setAmount] = useState("");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getIntermediary(slug).then((i) => { setItem(i); setService(i.services[0]); }).catch(() => setItem(null));
  }, [slug]);

  const start = async () => {
    if (!item) return;
    if (!isAuthenticated) { router.push(`/auth/signin?redirect=/escrow/intermediaries/${slug}`); return; }
    setBusy(true);
    try {
      const n = amount ? Number(amount) : undefined;
      const trade = await createTrade({ intermediaryId: item.id, serviceType: service, amountUsdt: n, instructions: instructions || undefined });
      router.push(`/escrow/my-trades?trade=${trade.id}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't start the trade", description: e instanceof Error ? e.message : "Please try again." });
    } finally { setBusy(false); }
  };

  if (item === undefined) return <div className="p-24 flex justify-center text-zinc-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (item === null) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-white min-h-screen text-center py-24">
        <h1 className="text-2xl font-bold mb-2">Intermediary not found</h1>
        <p className="text-zinc-400 mb-6">This intermediary is not listed.</p>
        <Link href="/escrow/intermediaries" className="text-red-400 hover:underline">Back to the directory</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-white min-h-screen">
      <Link href="/escrow/intermediaries" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> All intermediaries</Link>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{item.displayName}</h1>
            {item.verified && (
              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified{item.depositUsd > 0 ? ` · protected up to $${item.depositUsd.toLocaleString()}` : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 mb-3">Listed since {new Date(item.listedSince).toLocaleDateString()} · {item.completedTrades} completed trade{item.completedTrades === 1 ? "" : "s"}</p>
          <div className="flex flex-wrap gap-1">
            {item.services.map((s) => <span key={s} className="bg-zinc-950 text-zinc-300 border border-zinc-800 text-xs px-2 py-0.5 rounded">{SERVICE_LABEL[s]}</span>)}
          </div>
        </div>
        <button onClick={() => (isAuthenticated ? setOpen(true) : router.push(`/auth/signin?redirect=/escrow/intermediaries/${slug}`))}
          className="self-start bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3.5 rounded-xl text-sm">Request a trade</button>
      </div>

      <HowItWorks />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3">About</h2>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{item.bio || "This intermediary has not added a description."}</p>
            <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {item.commissionNote && <div><dt className="text-zinc-500 text-xs">Fee</dt><dd>{item.commissionNote}</dd></div>}
              {item.tradeLimitUsd ? <div><dt className="text-zinc-500 text-xs">Trade limit</dt><dd>${item.tradeLimitUsd.toLocaleString()}</dd></div> : null}
              {item.languages.length > 0 && <div><dt className="text-zinc-500 text-xs">Languages</dt><dd>{item.languages.join(", ")}</dd></div>}
            </dl>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-bold mb-1">Before you pay</h3>
            <p className="text-xs text-zinc-400 leading-normal">
              You pay the intermediary directly; Baalvion does not hold your money. Start a trade request first, agree the amount and fee in the trade chat, then pay and attach your screenshot.
              {item.depositUsd > 0 ? <> This intermediary has a refundable deposit of <strong className="text-white">${item.depositUsd.toLocaleString()}</strong> held by the platform. If you raise a dispute and an admin decides in your favour, your refund is taken from that deposit, up to the amount it still holds.</> : <> This intermediary has no deposit held, so a dispute cannot be refunded from one.</>}
              Disputes are reviewed by an admin who reads the chat and screenshots.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5 h-fit">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Pay by scanning</h3>
          {item.qrs.map((q) => (
            <div key={q.id} className="space-y-2">
              <p className="text-xs font-bold">{q.label}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl(item.id, q.id)} alt={`${item.displayName} ${q.label} QR`} className="mx-auto w-full max-w-[260px] rounded-lg border border-zinc-800 bg-white" />
            </div>
          ))}
          <p className="text-[11px] text-zinc-400">Scan with any UPI app. The name shown must be <strong className="text-white">{item.displayName}</strong>; if it is different, do not pay.</p>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-xl font-bold">Request a trade with {item.displayName}</h2>
            <label className="block text-sm"><span className="text-zinc-400">Service</span>
              <select value={service} onChange={(e) => setService(e.target.value as ServiceType)} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-2.5">
                {item.services.map((s) => <option key={s} value={s}>{SERVICE_LABEL[s]}</option>)}
              </select>
            </label>
            <label className="block text-sm"><span className="text-zinc-400">Amount in USDT (optional)</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-2.5" placeholder="e.g. 100" />
            </label>
            <label className="block text-sm"><span className="text-zinc-400">What do you need?</span>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} maxLength={1500} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-2.5" placeholder="Describe what you want done" />
            </label>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={start} disabled={busy} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg text-sm">{busy ? "Starting…" : "Start trade"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
