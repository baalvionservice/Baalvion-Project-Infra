"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { fileToProof, type ProofWithPreview } from "@/lib/image-proof";
import {
  SERVICE_LABEL, addTradeProofs, cancelTrade, completeTrade, confirmTradePayment, disputeTrade, getTrade, listTrades, markTradePaid,
  qrUrl, sendTradeMessage, tradeProofs, type Trade, type TradeDetail, type TradeProofImage, type TradeStatus,
} from "@/lib/api/intermediaries";

const STATUS_LABEL: Record<TradeStatus, string> = {
  created: "Waiting for your payment", payment_submitted: "Payment sent, waiting for the intermediary", in_progress: "In progress",
  completed: "Completed", cancelled: "Cancelled", disputed: "In dispute, an admin is reviewing",
};
const STATUS_COLOR: Record<TradeStatus, string> = {
  created: "text-amber-400", payment_submitted: "text-sky-400", in_progress: "text-purple-400", completed: "text-emerald-400", cancelled: "text-zinc-500", disputed: "text-red-400",
};

function Shots({ value, onChange }: { value: ProofWithPreview[]; onChange: (v: ProofWithPreview[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const add = async (files: FileList | null) => {
    if (!files) return;
    const next = await Promise.all(Array.from(files).slice(0, 3 - value.length).map((f) => fileToProof(f)));
    onChange([...value, ...next]);
    if (ref.current) ref.current.value = "";
  };
  return (
    <div className="flex flex-wrap gap-2">
      {value.map((s, i) => (
        <div key={i} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.preview} alt={`Screenshot ${i + 1}`} className="h-20 w-16 object-cover rounded-md border border-zinc-700" />
          <button aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 bg-black border border-zinc-600 rounded-full p-0.5"><X className="w-3 h-3" /></button>
        </div>
      ))}
      {value.length < 3 && (
        <button onClick={() => ref.current?.click()} className="h-20 w-16 flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-zinc-600 text-zinc-400 hover:text-white text-[10px]"><ImagePlus className="w-5 h-5" /> Add</button>
      )}
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" aria-label="Attach screenshot" onChange={(e) => void add(e.target.files)} />
    </div>
  );
}

function Trades() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [selected, setSelected] = useState<string | null>(params.get("trade"));
  const [detail, setDetail] = useState<TradeDetail | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [shots, setShots] = useState<ProofWithPreview[]>([]);
  const [note, setNote] = useState("");
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<TradeProofImage[] | null>(null);
  const [big, setBig] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const fail = (title: string, e: unknown) => toast({ variant: "destructive", title, description: e instanceof Error ? e.message : "Please try again." });
  const loadList = useCallback(async () => { try { setTrades((await listTrades()).items); } catch (e) { fail("Couldn't load trades", e); setTrades([]); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const loadDetail = useCallback(async (id: string) => { try { setDetail(await getTrade(id)); } catch { setDetail(null); } }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/auth/signin?redirect=/escrow/my-trades"); return; }
    void loadList();
    const t = setInterval(() => void loadList(), 20000);
    return () => clearInterval(t);
  }, [authLoading, isAuthenticated, router, loadList]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    setImages(null);
    void loadDetail(selected);
    const t = setInterval(() => void loadDetail(selected), 8000);
    return () => clearInterval(t);
  }, [selected, loadDetail]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [detail?.messages.length]);

  const run = async (fn: () => Promise<TradeDetail>, ok?: string) => {
    setBusy(true);
    try { setDetail(await fn()); if (ok) toast({ title: ok }); void loadList(); }
    catch (e) { fail("That did not work", e); }
    finally { setBusy(false); }
  };

  const showShots = async () => {
    if (!detail) return;
    try { setImages(await tradeProofs(detail.id)); } catch (e) { fail("Couldn't load screenshots", e); }
  };

  const d = detail;
  const isCustomer = d?.role === "customer";
  const isInt = d?.role === "intermediary";
  const open = d && !["completed", "cancelled"].includes(d.status);

  return (
    <div className="max-w-6xl mx-auto p-6 text-white min-h-screen">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold">My trades</h1>
          <p className="text-sm text-zinc-400">Trades you started, and trades customers started with you.</p>
        </div>
        <Link href="/escrow/intermediaries" className="text-sm text-red-400 hover:underline">Find an intermediary</Link>
      </div>

      {trades === null ? <div className="py-16 flex justify-center text-zinc-400"><Loader2 className="w-5 h-5 animate-spin" /></div> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2 lg:col-span-1">
            {trades.length === 0 && <p className="text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl p-6">No trades yet. Pick an intermediary to start one.</p>}
            {trades.map((t) => (
              <button key={t.id} onClick={() => { setSelected(t.id); router.replace(`/escrow/my-trades?trade=${t.id}`); }}
                className={`w-full text-left bg-zinc-900 border rounded-xl p-4 hover:border-zinc-600 ${selected === t.id ? "border-red-500" : "border-zinc-800"}`}>
                <div className="flex justify-between text-sm"><span className="font-mono">{t.ref}</span><span className={`text-xs ${STATUS_COLOR[t.status]}`}>{t.status.replace(/_/g, " ")}</span></div>
                <div className="text-xs text-zinc-400 mt-1">{SERVICE_LABEL[t.serviceType]}{t.amountUsdt ? ` · ${t.amountUsdt} USDT` : ""} · {t.role === "customer" ? `with ${t.intermediary.name}` : "you are the intermediary"}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {!d ? <p className="text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">{selected ? "Loading…" : "Select a trade to see the chat and next steps."}</p> : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <div className="font-mono text-lg">{d.ref}</div>
                    <div className="text-sm text-zinc-400">{SERVICE_LABEL[d.serviceType]}{d.amountUsdt ? ` · ${d.amountUsdt} USDT` : ""} · {isCustomer ? d.intermediary.name : `customer #${d.customerUserId}`}</div>
                  </div>
                  <div className={`text-sm font-bold ${STATUS_COLOR[d.status]}`}>{STATUS_LABEL[d.status]}</div>
                </div>
                {d.instructions && <p className="text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-lg p-3 whitespace-pre-line">{d.instructions}</p>}
                {d.disputeReason && <p className="text-sm text-red-300">Dispute: {d.disputeReason}</p>}
                {d.resolutionNote && <p className="text-sm text-zinc-300">Admin decision: {d.resolutionNote}</p>}

                {isCustomer && (d.status === "created" || d.status === "payment_submitted") && d.payQrs.length > 0 && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-zinc-300">Agree the amount in the chat, then pay by scanning. The name shown must be <strong className="text-white">{d.intermediary.name}</strong>.</p>
                    <div className="flex flex-wrap gap-4">
                      {d.payQrs.map((q) => (
                        <div key={q.id} className="space-y-1">
                          <p className="text-xs font-bold">{q.label}</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={qrUrl(d.intermediary.id, q.id)} alt={`${d.intermediary.name} ${q.label} QR`} className="w-40 h-40 rounded-md border border-zinc-800 bg-white object-contain" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {isCustomer && d.status === "created" && <button onClick={() => setPaying(true)} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-bold">I have paid</button>}
                  {isInt && d.status === "payment_submitted" && <button disabled={busy} onClick={() => run(() => confirmTradePayment(d.id), "Payment confirmed")} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-bold">Payment received</button>}
                  {isInt && d.status === "in_progress" && <button disabled={busy} onClick={() => run(() => completeTrade(d.id), "Marked as completed")} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-bold">Mark completed</button>}
                  {open && d.status !== "disputed" && ((isCustomer && d.status === "created") || (isInt && ["created", "payment_submitted", "in_progress"].includes(d.status))) && (
                    <button disabled={busy} onClick={() => run(() => cancelTrade(d.id), "Trade cancelled")} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm">Cancel trade</button>
                  )}
                  {(["payment_submitted", "in_progress"].includes(d.status) || d.status === "completed") && d.role !== "admin" && (
                    <button onClick={() => setDisputing(true)} className="bg-red-900/40 hover:bg-red-900/70 text-red-300 px-4 py-2 rounded-lg text-sm">Raise a dispute</button>
                  )}
                  {d.proofs.length > 0 && <button onClick={showShots} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm">View {d.proofs.length} screenshot{d.proofs.length > 1 ? "s" : ""}</button>}
                </div>

                {images && (
                  <div className="flex flex-wrap gap-3">
                    {images.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={p.dataUrl} alt={`Screenshot from the ${p.uploaderRole}`} onClick={() => setBig(p.dataUrl)} className="h-36 rounded-lg border border-zinc-700 cursor-zoom-in" />
                    ))}
                  </div>
                )}

                <div className="border-t border-zinc-800 pt-4">
                  <div className="h-64 overflow-y-auto space-y-2 pr-1" aria-label="Trade chat">
                    {d.messages.length === 0 && <p className="text-xs text-zinc-500">No messages yet. Say hello and agree the details here.</p>}
                    {d.messages.map((m) => (
                      <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.senderRole === d.role ? "ml-auto bg-red-900/40" : "bg-zinc-800"}`}>
                        <div className="text-[10px] text-zinc-400 mb-0.5">{m.senderRole === d.role ? "You" : m.senderRole} · {new Date(m.createdAt).toLocaleString()}</div>
                        <div className="whitespace-pre-line break-words">{m.body}</div>
                      </div>
                    ))}
                    <div ref={bottom} />
                  </div>
                  {d.status !== "cancelled" && (
                    <form className="flex gap-2 mt-3" onSubmit={(e) => { e.preventDefault(); const b = text.trim(); if (!b) return; setText(""); void run(() => sendTradeMessage(d.id, b)); }}>
                      <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Type a message…" aria-label="Message" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm" />
                      <button disabled={busy || !text.trim()} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg px-4" aria-label="Send"><Send className="w-4 h-4" /></button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {paying && d && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold">Tell {d.intermediary.name} you have paid</h2>
            <p className="text-sm text-zinc-400">Attach a screenshot of your payment so they can check it.</p>
            <Shots value={shots} onChange={setShots} />
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Note, for example the amount (optional)" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setPaying(false); setShots([]); }} className="px-4 py-2 text-sm text-zinc-400">Cancel</button>
              <button disabled={busy || shots.length === 0} onClick={async () => { await run(() => markTradePaid(d.id, shots.map(({ mime, data }) => ({ mime, data })), note || undefined), "Sent for checking"); setPaying(false); setShots([]); setNote(""); }}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 px-5 py-2 rounded-lg text-sm font-bold">Send</button>
            </div>
          </div>
        </div>
      )}

      {disputing && d && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold">Raise a dispute</h2>
            <p className="text-sm text-zinc-400">An admin will read the chat and screenshots and decide. Explain what went wrong (at least 10 characters).</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={1000} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setDisputing(false)} className="px-4 py-2 text-sm text-zinc-400">Cancel</button>
              <button disabled={busy || reason.trim().length < 10} onClick={async () => { await run(() => disputeTrade(d.id, reason.trim()), "Dispute raised"); setDisputing(false); setReason(""); }}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 px-5 py-2 rounded-lg text-sm font-bold">Raise dispute</button>
            </div>
          </div>
        </div>
      )}

      {big && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6 cursor-zoom-out" onClick={() => setBig(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={big} alt="Screenshot, full size" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

export default function MyTradesPage() {
  return <Suspense fallback={<div className="p-24 flex justify-center text-zinc-400"><Loader2 className="w-5 h-5 animate-spin" /></div>}><Trades /></Suspense>;
}
