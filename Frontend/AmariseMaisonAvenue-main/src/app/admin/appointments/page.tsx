"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  X,
  CheckCheck,
  UserX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  appointmentsAdminApi,
  type AppointmentAdminStatus,
} from "@/lib/api-client";
import type { StoreAppointment } from "@/lib/types";

/**
 * Appointments Admin — LIVE order-service.
 * Lists store appointments (appointmentsAdminApi.list) with a status filter, and lets
 * staff confirm / cancel / complete / mark no-show (appointmentsAdminApi.updateStatus).
 * Both calls require an ops_manager / store_viewer store role (enforced server-side).
 */

const FILTERABLE = ["requested", "confirmed", "completed", "cancelled", "no_show"];

const ACTIONS: { status: AppointmentAdminStatus; label: string; icon: React.ReactNode; tone: string }[] = [
  { status: "confirmed", label: "Confirm", icon: <Check className="w-3 h-3" />, tone: "text-emerald-400 hover:bg-emerald-500/10" },
  { status: "completed", label: "Complete", icon: <CheckCheck className="w-3 h-3" />, tone: "text-blue-400 hover:bg-blue-500/10" },
  { status: "cancelled", label: "Cancel", icon: <X className="w-3 h-3" />, tone: "text-red-400 hover:bg-red-500/10" },
  { status: "no_show", label: "No-show", icon: <UserX className="w-3 h-3" />, tone: "text-amber-400 hover:bg-amber-500/10" },
];

const STATUS_STYLE: Record<string, string> = {
  requested: "bg-white/10 text-white/50",
  confirmed: "bg-emerald-500/10 text-emerald-400",
  completed: "bg-blue-500/10 text-blue-400",
  cancelled: "bg-red-500/10 text-red-400",
  no_show: "bg-amber-500/10 text-amber-400",
};

export default function AppointmentsAdmin() {
  const { toast } = useToast();

  const [items, setItems] = useState<StoreAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await appointmentsAdminApi.list({
      pageSize: 100,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    });
    if (res.ok) setItems(res.data.items ?? []);
    else setError(res.error.message || "Could not load appointments.");
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const requested = items.filter((a) => a.status === "requested").length;
    const confirmed = items.filter((a) => a.status === "confirmed").length;
    return { total: items.length, requested, confirmed };
  }, [items]);

  const setStatus = async (id: string, status: AppointmentAdminStatus) => {
    setBusyId(id);
    const res = await appointmentsAdminApi.updateStatus(id, { status });
    setBusyId(null);
    if (res.ok) {
      toast({ title: "Appointment updated", description: `Now ${status.replace(/_/g, " ")}.` });
      setItems((prev) => prev.map((a) => (a.id === id ? res.data : a)));
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
            <span className="text-blue-400">Appointments</span>
          </nav>
          <div className="flex items-center gap-3 text-blue-400">
            <CalendarClock className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Concierge Operations</span>
          </div>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight uppercase">Appointments</h1>
          <p className="text-sm text-white/40 font-light italic">Showroom, virtual, in-home, and phone bookings.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 w-52 rounded-none bg-[#111113] border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-[#111113] border-white/10 rounded-none">
            <SelectItem value="all" className="text-[10px] uppercase font-bold">All Statuses</SelectItem>
            {FILTERABLE.map((s) => (
              <SelectItem key={s} value={s} className="text-[10px] uppercase font-bold">{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Kpi label="Total" value={stats.total} />
        <Kpi label="Requested" value={stats.requested} color="text-amber-400" />
        <Kpi label="Confirmed" value={stats.confirmed} color="text-emerald-400" />
      </div>

      <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-white/40 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest italic">Loading appointments…</p>
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
                <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Client</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">Type</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">Preferred</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-white/40">Status</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id} className="hover:bg-white/5 transition-colors border-white/5 h-16">
                  <TableCell className="pl-8">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white uppercase tracking-tight">{a.customerName}</span>
                      <span className="text-[9px] text-white/30 font-mono">{a.customerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[8px] uppercase border-none bg-white/10 text-white/60">
                      {a.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] font-mono text-white/50">
                    {a.preferredAt ? new Date(a.preferredAt).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[8px] uppercase border-none px-3 py-1", STATUS_STYLE[String(a.status)] || "bg-white/10 text-white/40")}>
                      {String(a.status || "requested").replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end items-center gap-1">
                      {busyId === a.id && <Loader2 className="w-3 h-3 animate-spin text-blue-400 mr-1" />}
                      {ACTIONS.map((act) => (
                        <Button
                          key={act.status}
                          variant="ghost"
                          size="sm"
                          disabled={busyId === a.id || a.status === act.status}
                          onClick={() => setStatus(a.id, act.status)}
                          className={cn("h-8 px-2 rounded-none text-[8px] font-bold uppercase tracking-widest text-white/40", act.tone)}
                          title={act.label}
                        >
                          {act.icon}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center text-white/30 text-[11px] font-bold uppercase tracking-widest italic">
                    No appointments match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
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
