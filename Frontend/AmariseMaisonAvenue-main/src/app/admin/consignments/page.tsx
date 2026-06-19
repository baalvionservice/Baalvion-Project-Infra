"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Gem,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Award,
  ArrowRightCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  consignmentAdminApi,
  type ConsignmentAuthStatus,
  type ConsignmentAuthConfidence,
  type ConsignmentPayoutType,
} from "@/lib/api-client";
import type { Consignment, ConsignmentItem } from "@/lib/types";

/**
 * Consignment Ops Queue — the core resale admin surface (LIVE order-service).
 * Lists every consignment request (status-filterable), advances the lifecycle
 * (quote → accept → received → authenticating → authenticated → listed → sold),
 * records a per-item authentication result, and issues a Certificate of Authenticity.
 * All calls require an ops_manager / store_viewer store role (enforced server-side).
 */

// Forward-only lifecycle (order-service REQUEST_STATUSES).
const REQUEST_STATUSES = [
  "submitted",
  "quoted",
  "accepted",
  "rejected",
  "received",
  "authenticating",
  "authenticated",
  "listed",
  "sold",
  "withdrawn",
] as const;

const AUTH_STATUSES: ConsignmentAuthStatus[] = ["pending", "in_review", "authenticated", "rejected"];
const CONFIDENCE: ConsignmentAuthConfidence[] = ["high", "medium", "low"];
const PAYOUT_TYPES: ConsignmentPayoutType[] = ["consignment", "buyout"];

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-white/10 text-white/50",
  quoted: "bg-plum/20 text-plum",
  accepted: "bg-blue-500/10 text-blue-400",
  rejected: "bg-red-500/10 text-red-400",
  received: "bg-indigo-500/10 text-indigo-400",
  authenticating: "bg-amber-500/10 text-amber-400",
  authenticated: "bg-emerald-500/10 text-emerald-400",
  listed: "bg-cyan-500/10 text-cyan-400",
  sold: "bg-emerald-500/20 text-emerald-300",
  withdrawn: "bg-red-500/10 text-red-400",
};

function itemSummary(c: Consignment): string {
  const items = c.items ?? [];
  if (items.length === 0) return "—";
  const head = [items[0].brand, items[0].model].filter(Boolean).join(" ");
  return items.length > 1 ? `${head} +${items.length - 1}` : head || "—";
}

export default function ConsignmentOpsQueue() {
  const { toast } = useToast();

  const [requests, setRequests] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Consignment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await consignmentAdminApi.list({
      pageSize: 100,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    });
    if (res.ok) setRequests(res.data.items ?? []);
    else setError(res.error.message || "Could not load consignment requests.");
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const pendingReview = requests.filter((r) => ["submitted", "received", "authenticating"].includes(String(r.status))).length;
    const listed = requests.filter((r) => r.status === "listed").length;
    const sold = requests.filter((r) => r.status === "sold").length;
    return { total: requests.length, pendingReview, listed, sold };
  }, [requests]);

  const onUpdated = (updated: Consignment) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelected((s) => (s && s.id === updated.id ? updated : s));
  };

  return (
    <div className="space-y-12 animate-fade-in font-body pb-20 text-white">
      <header className="flex justify-between items-end border-b border-white/5 pb-10">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/30 flex items-center space-x-2">
            <Link href="/admin">Terminal</Link>
            <ChevronRight className="w-2.5 h-2.5" />
            <span className="text-blue-400">Consignment Ops</span>
          </nav>
          <div className="flex items-center gap-3 text-blue-400">
            <Gem className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Resale Operations</span>
          </div>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight uppercase">Consignment Queue</h1>
          <p className="text-sm text-white/40 font-light italic">Intake, authentication, and certification of resale pieces.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 w-52 rounded-none bg-[#111113] border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-[#111113] border-white/10 rounded-none">
            <SelectItem value="all" className="text-[10px] uppercase font-bold">All Statuses</SelectItem>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-[10px] uppercase font-bold">{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Kpi label="Requests" value={stats.total} />
        <Kpi label="Awaiting Review" value={stats.pendingReview} color="text-amber-400" />
        <Kpi label="Listed" value={stats.listed} color="text-cyan-400" />
        <Kpi label="Sold" value={stats.sold} color="text-emerald-400" />
      </div>

      <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-white/40 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest italic">Loading consignment queue…</p>
          </div>
        ) : error ? (
          <div className="py-32 flex flex-col items-center justify-center text-red-400 space-y-4">
            <AlertCircle className="w-8 h-8" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-center max-w-md px-6">{error}</p>
            <Button
              variant="outline"
              onClick={load}
              className="h-10 rounded-none border-white/10 text-white/60 text-[9px] font-bold uppercase tracking-widest hover:bg-white/5"
            >
              Retry
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Reference</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">Seller</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">Pieces</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">Submitted</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">Status</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id} className="hover:bg-white/5 transition-colors border-white/5 h-16">
                  <TableCell className="pl-8 font-mono text-[10px] uppercase text-blue-400">{r.reference}</TableCell>
                  <TableCell className="text-[11px] text-white/70">{r.contactName || r.contactEmail}</TableCell>
                  <TableCell className="text-[11px] text-white/50">{itemSummary(r)}</TableCell>
                  <TableCell className="text-[10px] font-mono text-white/40">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[8px] uppercase border-none px-3 py-1", STATUS_STYLE[String(r.status)] || "bg-white/10 text-white/40")}>
                      {String(r.status).replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[9px] font-bold uppercase tracking-widest text-blue-400 hover:text-white"
                      onClick={() => setSelected(r)}
                    >
                      Manage <ArrowRightCircle className="ml-2 w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-24 text-center text-white/30 text-[11px] font-bold uppercase tracking-widest italic">
                    No consignment requests match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <ConsignmentDrawer
        request={selected}
        onClose={() => setSelected(null)}
        onUpdated={onUpdated}
        notify={toast}
      />
    </div>
  );
}

type ToastFn = ReturnType<typeof useToast>["toast"];

function ConsignmentDrawer({
  request,
  onClose,
  onUpdated,
  notify,
}: {
  request: Consignment | null;
  onClose: () => void;
  onUpdated: (c: Consignment) => void;
  notify: ToastFn;
}) {
  const [nextStatus, setNextStatus] = useState<string>("");
  const [quoteAmount, setQuoteAmount] = useState<string>("");
  const [quoteCurrency, setQuoteCurrency] = useState<string>("USD");
  const [payoutType, setPayoutType] = useState<ConsignmentPayoutType>("consignment");
  const [commissionRate, setCommissionRate] = useState<string>("");
  const [reviewerNotes, setReviewerNotes] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (request) {
      setNextStatus(String(request.status));
      setQuoteAmount("");
      setCommissionRate("");
      setReviewerNotes("");
    }
  }, [request]);

  if (!request) return null;

  const submitStatus = async () => {
    if (!nextStatus) return;
    setBusy(true);
    const res = await consignmentAdminApi.updateStatus(request.id, {
      status: nextStatus,
      ...(quoteAmount ? { quoteAmount: Number(quoteAmount), quoteCurrency } : {}),
      ...(nextStatus === "quoted" || nextStatus === "accepted" ? { payoutType } : {}),
      ...(commissionRate ? { commissionRate: Number(commissionRate) } : {}),
      ...(reviewerNotes ? { reviewerNotes } : {}),
    });
    setBusy(false);
    if (res.ok) {
      notify({ title: "Status advanced", description: `Now ${nextStatus.replace(/_/g, " ")}.` });
      onUpdated(res.data);
    } else {
      notify({ variant: "destructive", title: "Update failed", description: res.error.message });
    }
  };

  return (
    <Sheet open={!!request} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-[640px] bg-[#0A0A0B] border-l border-white/10 p-0 rounded-none text-white overflow-y-auto custom-scrollbar">
        <SheetHeader className="p-10 bg-white/[0.02] border-b border-white/5 text-left">
          <SheetTitle className="font-headline text-2xl uppercase italic tracking-tighter text-white">{request.reference}</SheetTitle>
          <SheetDescription className="text-[10px] uppercase font-bold tracking-widest text-white/30">
            {request.contactName || request.contactEmail} •{" "}
            <span className={cn("px-2 py-0.5", STATUS_STYLE[String(request.status)])}>{String(request.status).replace(/_/g, " ")}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="p-10 space-y-10">
          {/* Advance status */}
          <section className="space-y-5">
            <SectionTitle icon={<ArrowRightCircle className="w-4 h-4" />}>Advance Lifecycle</SectionTitle>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Next Status">
                <Select value={nextStatus} onValueChange={setNextStatus}>
                  <SelectTrigger className="h-11 rounded-none bg-white/5 border-white/10 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111113] border-white/10 rounded-none">
                    {REQUEST_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs uppercase">{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Payout Type">
                <Select value={payoutType} onValueChange={(v) => setPayoutType(v as ConsignmentPayoutType)}>
                  <SelectTrigger className="h-11 rounded-none bg-white/5 border-white/10 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111113] border-white/10 rounded-none">
                    {PAYOUT_TYPES.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs uppercase">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Quote Amount">
                <Input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  className="rounded-none bg-white/5 border-white/10 h-11 text-xs text-white"
                  placeholder="e.g. 8500"
                />
              </Field>
              <Field label="Quote Currency">
                <Input
                  value={quoteCurrency}
                  onChange={(e) => setQuoteCurrency(e.target.value.toUpperCase().slice(0, 3))}
                  className="rounded-none bg-white/5 border-white/10 h-11 text-xs font-mono text-white"
                  placeholder="USD"
                />
              </Field>
              <Field label="Commission %">
                <Input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="rounded-none bg-white/5 border-white/10 h-11 text-xs text-white"
                  placeholder="e.g. 20"
                />
              </Field>
            </div>
            <Field label="Reviewer Notes">
              <Textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                className="rounded-none bg-white/5 border-white/10 min-h-[70px] text-xs text-white"
              />
            </Field>
            <Button
              onClick={submitStatus}
              disabled={busy}
              className="h-11 rounded-none bg-blue-600 text-white hover:bg-blue-500 text-[10px] font-bold uppercase tracking-widest"
            >
              {busy && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
              Apply Status
            </Button>
          </section>

          {/* Per-item authentication + certificate */}
          <section className="space-y-5 pt-6 border-t border-white/5">
            <SectionTitle icon={<ShieldCheck className="w-4 h-4" />}>Item Authentication &amp; Certificates</SectionTitle>
            {(request.items ?? []).map((item, idx) => (
              <ItemPanel key={item.id || idx} requestId={request.id} item={item} index={idx} notify={notify} />
            ))}
            {(request.items ?? []).length === 0 && (
              <p className="text-[10px] text-white/30 italic">No items on this request.</p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ItemPanel({
  requestId,
  item,
  index,
  notify,
}: {
  requestId: string;
  item: ConsignmentItem;
  index: number;
  notify: ToastFn;
}) {
  const [authStatus, setAuthStatus] = useState<ConsignmentAuthStatus>("in_review");
  const [authenticatorName, setAuthenticatorName] = useState("");
  const [method, setMethod] = useState("");
  const [findings, setFindings] = useState("");
  const [confidence, setConfidence] = useState<ConsignmentAuthConfidence>("high");
  const [serialNumber, setSerialNumber] = useState(item.serialNumber ?? "");
  const [savingAuth, setSavingAuth] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const itemId = item.id;
  const hasItemId = typeof itemId === "string" && itemId.length > 0;

  const recordAuth = async () => {
    if (!hasItemId) return;
    setSavingAuth(true);
    const res = await consignmentAdminApi.recordAuthentication(requestId, itemId, {
      status: authStatus,
      ...(authenticatorName ? { authenticatorName } : {}),
      ...(method ? { method } : {}),
      ...(findings ? { findings } : {}),
      confidence,
    });
    setSavingAuth(false);
    if (res.ok) notify({ title: "Authentication recorded", description: `Item marked ${authStatus.replace(/_/g, " ")}.` });
    else notify({ variant: "destructive", title: "Failed", description: res.error.message });
  };

  const issueCert = async () => {
    if (!hasItemId) return;
    setIssuing(true);
    const res = await consignmentAdminApi.issueCertificate(requestId, itemId, {
      ...(serialNumber ? { serialNumber } : {}),
    });
    setIssuing(false);
    if (res.ok) {
      notify({ title: "Certificate issued", description: `Code: ${res.data.code}` });
    } else {
      notify({ variant: "destructive", title: "Could not issue certificate", description: res.error.message });
    }
  };

  return (
    <div className="border border-white/10 bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-tight text-white">
            {[item.brand, item.model].filter(Boolean).join(" ") || `Item ${index + 1}`}
          </p>
          <p className="text-[9px] text-white/30 uppercase tracking-widest">
            {item.conditionGrade ? item.conditionGrade.replace(/_/g, " ") : "—"}
          </p>
        </div>
        <Award className="w-4 h-4 text-gold" />
      </div>

      {!hasItemId && (
        <p className="text-[9px] text-amber-400 italic">This item has no id yet — authentication/certificate actions are unavailable.</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Auth Status">
          <Select value={authStatus} onValueChange={(v) => setAuthStatus(v as ConsignmentAuthStatus)}>
            <SelectTrigger className="h-10 rounded-none bg-white/5 border-white/10 text-[11px] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#111113] border-white/10 rounded-none">
              {AUTH_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-[11px] uppercase">{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Confidence">
          <Select value={confidence} onValueChange={(v) => setConfidence(v as ConsignmentAuthConfidence)}>
            <SelectTrigger className="h-10 rounded-none bg-white/5 border-white/10 text-[11px] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#111113] border-white/10 rounded-none">
              {CONFIDENCE.map((c) => (
                <SelectItem key={c} value={c} className="text-[11px] uppercase">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Authenticator">
          <Input value={authenticatorName} onChange={(e) => setAuthenticatorName(e.target.value)} className="rounded-none bg-white/5 border-white/10 h-10 text-[11px] text-white" />
        </Field>
        <Field label="Method">
          <Input value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-none bg-white/5 border-white/10 h-10 text-[11px] text-white" />
        </Field>
      </div>
      <Field label="Findings">
        <Textarea value={findings} onChange={(e) => setFindings(e.target.value)} className="rounded-none bg-white/5 border-white/10 min-h-[60px] text-[11px] text-white" />
      </Field>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Field label="Serial Number (for certificate)">
            <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="rounded-none bg-white/5 border-white/10 h-10 text-[11px] font-mono text-white" />
          </Field>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={recordAuth}
          disabled={savingAuth || !hasItemId}
          variant="outline"
          className="h-10 flex-1 rounded-none border-white/10 text-white/70 text-[9px] font-bold uppercase tracking-widest hover:bg-white/5"
        >
          {savingAuth && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
          Record Auth
        </Button>
        <Button
          onClick={issueCert}
          disabled={issuing || !hasItemId}
          className="h-10 flex-1 rounded-none bg-gold/80 text-black hover:bg-gold text-[9px] font-bold uppercase tracking-widest"
        >
          {issuing && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
          Issue Certificate
        </Button>
      </div>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-blue-400">
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-[0.4em]">{children}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[9px] uppercase font-bold tracking-widest text-white/40">{label}</Label>
      {children}
    </div>
  );
}

function Kpi({ label, value, color = "text-white" }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <Card className="bg-[#111113] border-white/5 p-8 space-y-3 rounded-none shadow-xl">
      <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">{label}</span>
      <div className={cn("text-4xl font-headline font-bold italic tabular", color)}>{value}</div>
    </Card>
  );
}
