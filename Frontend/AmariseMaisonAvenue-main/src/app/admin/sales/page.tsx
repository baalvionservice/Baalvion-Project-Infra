"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Target,
  ChevronRight,
  Loader2,
  AlertCircle,
  Package,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  orderApi,
  type Order,
  type OrderStatus,
} from "@/lib/api-client";

/**
 * Sales / Order Management — LIVE order-service.
 * Lists store orders (orderApi.list) with a status filter, an order detail drawer,
 * and forward status advancement (orderApi.updateStatus, ops_manager-gated server-side).
 */

const ORDER_STATUSES: OrderStatus[] = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-white/10 text-white/50",
  confirmed: "bg-blue-500/10 text-blue-400",
  processing: "bg-indigo-500/10 text-indigo-400",
  shipped: "bg-amber-500/10 text-amber-400",
  delivered: "bg-emerald-500/10 text-emerald-400",
  cancelled: "bg-red-500/10 text-red-400",
  refunded: "bg-red-500/10 text-red-400",
};

export default function AdminOrdersHub() {
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await orderApi.list({
      pageSize: 100,
      ...(statusFilter !== "all" ? { status: statusFilter as OrderStatus } : {}),
    });
    if (res.ok) setOrders(res.data.items ?? []);
    else setError(res.error.message || "Could not load orders.");
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter((o) => o.paymentStatus === "paid");
    const revenue = paid.reduce((acc, o) => acc + (o.totalAmount ?? 0), 0);
    const open = orders.filter(
      (o) => !["delivered", "cancelled", "refunded"].includes(o.status),
    ).length;
    return { total, paidCount: paid.length, revenue, open };
  }, [orders]);

  const handleStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    const res = await orderApi.updateStatus(orderId, status);
    setUpdatingId(null);
    if (res.ok) {
      toast({ title: "Order updated", description: `Order is now ${status}.` });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
      setSelected((s) => (s && s.id === orderId ? res.data : s));
    } else {
      toast({ variant: "destructive", title: "Update failed", description: res.error.message });
    }
  };

  return (
    <div className="space-y-12 animate-fade-in font-body pb-20 text-white">
      <header className="flex justify-between items-end border-b border-white/5 pb-10">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/30 flex items-center space-x-2">
            <Link href="/admin">Terminal</Link>
            <ChevronRight className="w-2.5 h-2.5" />
            <span className="text-blue-400">Order Management</span>
          </nav>
          <div className="flex items-center gap-3 text-blue-400">
            <Target className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Layer 5 — Sales</span>
          </div>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight uppercase">Order Stream</h1>
          <p className="text-sm text-white/40 font-light italic">Live acquisition fulfillment & settlement.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 w-48 rounded-none bg-[#111113] border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-[#111113] border-white/10 rounded-none">
            <SelectItem value="all" className="text-[10px] uppercase font-bold">All Statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-[10px] uppercase font-bold">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Kpi label="Orders" value={kpis.total} />
        <Kpi label="Open" value={kpis.open} color="text-amber-400" />
        <Kpi label="Paid" value={kpis.paidCount} color="text-emerald-400" />
        <Kpi label="Paid Revenue" value={`$${(kpis.revenue / 1000).toFixed(1)}k`} color="text-blue-400" />
      </div>

      <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-white/40 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest italic">Loading orders…</p>
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
                <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Order</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">Market</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">Total</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">Payment</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">Status</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Advance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-white/5 transition-colors border-white/5 h-16 cursor-pointer"
                  onClick={() => setSelected(order)}
                >
                  <TableCell className="pl-8 font-mono text-blue-400 text-[10px] uppercase">
                    {order.orderNumber || order.id}
                  </TableCell>
                  <TableCell className="text-[10px] uppercase tracking-widest text-white/50">
                    {(order.market || order.country || "—").toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm font-bold tabular">
                    {order.currencyCode} {(order.totalAmount ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[7px] uppercase border-none bg-white/10 text-white/50">
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[8px] uppercase border-none px-3 py-1", STATUS_STYLE[order.status] || "bg-white/10 text-white/40")}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end items-center space-x-2">
                      {updatingId === order.id && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                      <Select value={order.status} onValueChange={(v) => handleStatus(order.id, v as OrderStatus)}>
                        <SelectTrigger className="h-9 w-32 rounded-none bg-white/5 border-white/10 text-[9px] font-bold uppercase tracking-widest text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111113] border-white/10 rounded-none">
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-[9px] uppercase font-bold">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-24 text-center text-white/30 text-[11px] font-bold uppercase tracking-widest italic">
                    No orders match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Order detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-[560px] bg-[#0A0A0B] border-l border-white/10 p-0 rounded-none text-white">
          {selected && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-10 bg-white/[0.02] border-b border-white/5 text-left">
                <SheetTitle className="font-headline text-2xl uppercase italic tracking-tighter text-white">
                  {selected.orderNumber || selected.id}
                </SheetTitle>
                <SheetDescription className="text-[10px] uppercase font-bold tracking-widest text-white/30">
                  {new Date(selected.createdAt).toLocaleString()}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <DetailRow label="Status" value={selected.status} />
                  <DetailRow label="Payment" value={selected.paymentStatus} />
                  <DetailRow label="Market" value={(selected.market || selected.country || "—").toUpperCase()} />
                  <DetailRow label="Gateway" value={String(selected.gateway || "—")} />
                </div>
                <div className="space-y-3 pt-6 border-t border-white/5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">Line Items</p>
                  {(selected.items ?? []).map((it, i) => (
                    <div key={it.id || `${it.productId}-${i}`} className="flex items-center justify-between text-xs">
                      <span className="text-white/70 flex items-center gap-2">
                        <Package className="w-3 h-3 text-white/30" />
                        {it.name || it.sku || it.productId} × {it.quantity}
                      </span>
                      <span className="font-bold tabular">
                        {selected.currencyCode} {((it.total ?? it.unitPrice * it.quantity) || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {(selected.items ?? []).length === 0 && (
                    <p className="text-[10px] text-white/30 italic">No line items returned.</p>
                  )}
                </div>
                <div className="space-y-2 pt-6 border-t border-white/5">
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Subtotal</span>
                    <span className="tabular">{selected.currencyCode} {(selected.subtotal ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Tax</span>
                    <span className="tabular">{selected.currencyCode} {(selected.taxAmount ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/5">
                    <span>Total</span>
                    <span className="tabular">{selected.currencyCode} {(selected.totalAmount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="p-10 bg-white/[0.02] border-t border-white/5">
                <Select value={selected.status} onValueChange={(v) => handleStatus(selected.id, v as OrderStatus)}>
                  <SelectTrigger className="h-12 w-full rounded-none bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111113] border-white/10 rounded-none">
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-[10px] uppercase font-bold">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/30">{label}</p>
      <p className="text-xs font-bold uppercase text-white/80">{value}</p>
    </div>
  );
}
