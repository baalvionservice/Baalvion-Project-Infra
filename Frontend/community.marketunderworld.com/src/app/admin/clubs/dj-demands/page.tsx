"use client";

import { useState, useEffect, useCallback } from "react";
import { Radio, TrendingUp, Users, RefreshCw, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { admin } from "@/lib/api/nightlife";
import { cn } from "@/lib/utils";

interface DjDemand {
  id: string;
  djName: string;
  genre?: string;
  location?: string;
  city?: string;
  totalPledged?: number;
  pledgeCount?: number;
  status?: "open" | "confirmed" | "closed";
  createdAt?: string;
}

const STATUS_STYLE: Record<string, string> = {
  open:      "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-green-500/15 text-green-400 border-green-500/30",
  closed:    "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

export default function AdminDjDemandsPage() {
  const [demands, setDemands] = useState<DjDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "confirmed">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await admin.djDemands();
      setDemands(res.items ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load DJ demands.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? demands : demands.filter(d => d.status === filter);

  const totalPledged = demands.reduce((sum, d) => sum + (d.totalPledged ?? 0), 0);
  const openCount = demands.filter(d => d.status === "open" || !d.status).length;
  const confirmedCount = demands.filter(d => d.status === "confirmed").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Radio className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">DJ Demand Requests</h1>
          </div>
          <p className="text-gray-500 text-sm ml-[52px]">
            Public DJ booking demands submitted by members. Review pledges and confirm DJ bookings.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Demands", val: demands.length, icon: Radio, color: "text-purple-400" },
          { label: "Open / Pending", val: openCount, icon: Clock, color: "text-amber-400" },
          { label: "Confirmed", val: confirmedCount, icon: CheckCircle, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <s.icon className={cn("w-5 h-5", s.color)} />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{s.label}</span>
            </div>
            <p className={cn("text-3xl font-black", s.color)}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Total pledged banner */}
      {totalPledged > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 rounded-2xl p-5 flex items-center gap-4">
          <TrendingUp className="w-6 h-6 text-purple-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">Total Pledged Across All Demands</p>
            <p className="text-2xl font-black text-white">₹{totalPledged.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "open", "confirmed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold capitalize border transition-all",
              filter === f
                ? "bg-purple-600 text-white border-purple-600"
                : "border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <p className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</p>
      )}

      {/* Demand list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-gray-700" />
            Loading demands…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎧</p>
            <p className="text-gray-500 font-medium">
              {filter === "all" ? "No DJ demands submitted yet." : `No ${filter} demands.`}
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Demands appear here when users submit them from the DJ Demand page.
            </p>
          </div>
        ) : (
          filtered.map(d => (
            <div key={d.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <button
                className="w-full p-5 flex items-center justify-between gap-4 hover:bg-white/[0.03] transition-colors"
                onClick={() => setExpanded(expanded === d.id ? null : d.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Radio className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-white truncate">{d.djName}</p>
                    <p className="text-xs text-gray-500 truncate">{d.genre ?? "—"} · {d.city ?? d.location ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {d.totalPledged != null && d.totalPledged > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-black text-purple-400">₹{d.totalPledged.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-600">{d.pledgeCount ?? 0} pledges</p>
                    </div>
                  )}
                  <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize", STATUS_STYLE[d.status ?? "open"])}>
                    {d.status ?? "open"}
                  </span>
                  {expanded === d.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </button>

              {expanded === d.id && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Demand ID</p>
                      <p className="font-mono text-gray-300 text-xs">{d.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Location</p>
                      <p className="text-gray-300">{d.city ?? d.location ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Submitted</p>
                      <p className="text-gray-300">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Confirmed
                    </button>
                    <button className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors flex items-center justify-center gap-2">
                      <Users className="w-3.5 h-3.5" /> View Pledgers
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
