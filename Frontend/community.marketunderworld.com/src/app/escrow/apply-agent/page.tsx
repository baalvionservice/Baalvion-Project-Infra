"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { PayToPanel } from "@/components/payments/pay-to-panel";
import { ReviewStatus } from "@/components/payments/review-status";
import { fileToProof, type ProofWithPreview } from "@/lib/image-proof";
import { listPaymentMethods, submitPayment, type PaymentMethodInfo } from "@/lib/api/seller-access";
import { SERVICE_LABEL, applyToBeIntermediary, myIntermediary, type OwnIntermediary, type ServiceType } from "@/lib/api/intermediaries";
import type { CategoryPayment } from "@/lib/api/seller-access";

const DEPOSIT_USD = 1000;
type Qr = ProofWithPreview & { label: string };

export default function ApplyAgentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<{ intermediary: OwnIntermediary | null; payment: CategoryPayment | null } | null>(null);
  const [methods, setMethods] = useState<PaymentMethodInfo[]>([]);
  const [busy, setBusy] = useState(false);

  // form
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [services, setServices] = useState<ServiceType[]>(["buy_usdt"]);
  const [languages, setLanguages] = useState("");
  const [commission, setCommission] = useState("");
  const [limit, setLimit] = useState("");
  const [qrs, setQrs] = useState<Qr[]>([]);
  const [method, setMethod] = useState<"BTC" | "USDT" | "BINANCE">("USDT");
  const [network, setNetwork] = useState<"TRC20" | "BEP20" | "ERC20" | "SOLANA">("TRC20");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try { setState(await myIntermediary()); } catch { setState({ intermediary: null, payment: null }); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/auth/signin?redirect=/escrow/apply-agent"); return; }
    void load();
    listPaymentMethods().then(setMethods).catch(() => {});
  }, [authLoading, isAuthenticated, router, load]);

  const addQr = async (files: FileList | null) => {
    if (!files) return;
    const next = await Promise.all(Array.from(files).slice(0, 3 - qrs.length).map(async (f) => ({ ...(await fileToProof(f, 1400)), label: qrs.length === 0 ? "PhonePe" : "UPI" })));
    setQrs((cur) => [...cur, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    setBusy(true);
    try {
      await applyToBeIntermediary({
        displayName, bio: bio || undefined, services, languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
        commissionNote: commission || undefined, tradeLimitUsd: limit ? Number(limit) : undefined,
        qrs: qrs.map(({ mime, data, label }) => ({ mime, data, label })), currency: method, network: method === "USDT" ? network : undefined,
      });
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't submit", description: e instanceof Error ? e.message : "Please try again." });
    } finally { setBusy(false); }
  };

  const sendProof = async (body: Parameters<typeof submitPayment>[1]) => {
    if (!state?.payment) return;
    setBusy(true);
    try { await submitPayment(state.payment.id, body); await load(); }
    catch (e) { toast({ variant: "destructive", title: "Couldn't send", description: e instanceof Error ? e.message : "Please try again." }); }
    finally { setBusy(false); }
  };

  if (authLoading || !state) return <div className="p-24 flex justify-center text-zinc-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  const me = state.intermediary;
  const pay = state.payment;
  const canApply = !me || me.status === "rejected";
  const valid = displayName.trim().length >= 2 && services.length > 0 && qrs.length > 0;
  const available = (m: string) => methods.find((x) => x.method === m)?.available !== false;

  return (
    <div className="max-w-3xl mx-auto p-6 text-white min-h-screen">
      <div className="text-center mb-8 mt-6">
        <h1 className="text-4xl font-bold mb-3 text-red-500">Become an intermediary</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Help members buy USDT, trade crypto and set up accounts, and get paid directly by the customer. Apply, pay the ${DEPOSIT_USD.toLocaleString()} refundable deposit, and once an admin approves you are listed automatically.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
        {me?.status === "active" && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-emerald-400">You are listed</h2>
            <p className="text-sm text-zinc-300">Customers can now find you and send trade requests.</p>
            <div className="flex gap-3 flex-wrap">
              <Link href={`/escrow/intermediaries/${me.slug}`} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-bold">View my page</Link>
              <Link href="/escrow/agent-dashboard" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-bold">Open my trades</Link>
            </div>
          </div>
        )}

        {me?.status === "suspended" && <p className="text-sm text-red-300">Your listing is suspended. Contact an admin.</p>}

        {me?.status === "payment_submitted" && pay && <ReviewStatus payment={pay} onRefresh={load} />}

        {me?.status === "applied" && pay?.status === "awaiting_payment" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Pay the ${DEPOSIT_USD.toLocaleString()} deposit to finish applying</h2>
            <p className="text-sm text-zinc-400">Your application for <strong className="text-white">{me.displayName}</strong> is saved. Once an admin confirms your deposit you are listed.</p>
            <PayToPanel payment={pay} amountUsd={DEPOSIT_USD} busy={busy} onSubmit={sendProof} />
          </div>
        )}

        {me?.status === "rejected" && (
          <p className="text-sm text-red-300">Your last application was not approved{pay?.note ? `: ${pay.note}` : ""}. You can apply again below.</p>
        )}

        {canApply && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Your application</h2>
            <label className="block text-sm"><span className="text-zinc-300">Name people will see</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={120} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-3" placeholder="Your full name or trading name" /></label>
            <label className="block text-sm"><span className="text-zinc-300">About you (optional)</span>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={1500} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-3" /></label>
            <div className="text-sm"><span className="text-zinc-300">What you help with</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(SERVICE_LABEL) as ServiceType[]).map((s) => (
                  <label key={s} className="flex items-center gap-2 text-zinc-300">
                    <input type="checkbox" className="accent-red-500" checked={services.includes(s)}
                      onChange={(e) => setServices((cur) => (e.target.checked ? [...cur, s] : cur.filter((x) => x !== s)))} /> {SERVICE_LABEL[s]}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm"><span className="text-zinc-300">Your fee (optional)</span>
                <input value={commission} onChange={(e) => setCommission(e.target.value)} maxLength={200} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-3" placeholder="e.g. 1% per trade" /></label>
              <label className="block text-sm"><span className="text-zinc-300">Largest trade in USD (optional)</span>
                <input value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-3" /></label>
            </div>
            <label className="block text-sm"><span className="text-zinc-300">Languages (comma separated, optional)</span>
              <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-3" placeholder="English, Hindi" /></label>

            <div className="text-sm"><span className="text-zinc-300">Your payment QR codes (1 to 3)</span>
              <p className="text-xs text-zinc-500 mb-2">The QR customers scan to pay you, for example PhonePe or your bank UPI. Customers see the QR and your name, not your UPI ID.</p>
              <div className="flex flex-wrap gap-3">
                {qrs.map((q, i) => (
                  <div key={i} className="relative w-32 space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={q.preview} alt={`QR ${i + 1}`} className="w-32 h-32 object-cover rounded-md border border-zinc-800 bg-white" />
                    <input value={q.label} onChange={(e) => setQrs((cur) => cur.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} maxLength={60} aria-label="QR label" className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs" />
                    <button aria-label="Remove QR" onClick={() => setQrs((cur) => cur.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 bg-black border border-zinc-700 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {qrs.length < 3 && (
                  <button onClick={() => fileRef.current?.click()} className="w-32 h-32 flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-zinc-700 text-zinc-400 hover:text-white text-xs"><ImagePlus className="w-6 h-6" /> Add QR</button>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void addQr(e.target.files)} aria-label="Add payment QR image" />
              </div>
            </div>

            <div className="text-sm"><span className="text-zinc-300">Pay the ${DEPOSIT_USD.toLocaleString()} deposit with</span>
              <div className="mt-2 flex gap-2 flex-wrap">
                {(["USDT", "BTC", "BINANCE"] as const).map((m) => (
                  <button key={m} disabled={!available(m)} onClick={() => setMethod(m)}
                    className={`px-4 h-9 rounded-lg text-xs font-bold ${method === m ? "bg-red-600 text-white" : "bg-zinc-950 border border-zinc-800 text-zinc-300"} disabled:opacity-40`}>{m === "BINANCE" ? "Binance Pay" : m}</button>
                ))}
                {method === "USDT" && (
                  <select value={network} onChange={(e) => setNetwork(e.target.value as typeof network)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-xs">
                    {["TRC20", "BEP20", "ERC20", "SOLANA"].map((n) => <option key={n}>{n}</option>)}
                  </select>
                )}
              </div>
            </div>

            <button onClick={submit} disabled={busy || !valid} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl">
              {busy ? "Saving…" : "Save application and continue to the deposit"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
