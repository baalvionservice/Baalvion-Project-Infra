"use client";

import { useCallback, useEffect, useState } from "react";
import { TicketThread } from "@/components/support/ticket-thread";
import { supportAdmin, type Ticket, type TicketDetail, type TicketStatus } from "@/lib/api/staff";

const box = "bg-white rounded-xl shadow-sm border border-gray-100";
const STATUS_STYLE: Record<TicketStatus, string> = { open: "bg-amber-100 text-amber-800", pending: "bg-blue-100 text-blue-800", resolved: "bg-green-100 text-green-800", closed: "bg-gray-200 text-gray-700" };
const msg = (e: unknown, f: string) => (e instanceof Error ? e.message : f);

export default function SupportTicketsPage() {
  const [status, setStatus] = useState<TicketStatus | "all">("open");
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState<Partial<Record<TicketStatus, number>>>({});
  const [open, setOpen] = useState<TicketDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await supportAdmin.list({ status: status === "all" ? undefined : status, assigned: mine ? "me" : undefined, q: q.trim() || undefined });
      setItems(res.items);
      setCounts(res.counts);
    } catch (e) { setError(msg(e, "Could not load tickets")); } finally { setLoading(false); }
  }, [status, mine, q]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const show = async (id: string) => { try { setOpen(await supportAdmin.get(id)); } catch (e) { setError(msg(e, "Could not open the ticket")); } };
  const update = async (d: Parameters<typeof supportAdmin.update>[1]) => {
    if (!open) return;
    try { await supportAdmin.update(open.id, d); setOpen(await supportAdmin.get(open.id)); await load(); } catch (e) { setError(msg(e, "Could not update the ticket")); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support tickets</h1>
        <p className="text-gray-500 mt-2">A reply moves the ticket to &ldquo;pending&rdquo; and emails the member. When the member writes back it returns to &ldquo;open&rdquo;.</p>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {(["open", "pending", "resolved", "closed", "all"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`px-4 py-2 rounded-lg text-sm capitalize border ${status === s ? "bg-fuchsia-600 text-white border-fuchsia-600" : "bg-white border-gray-200 text-gray-600"}`}>
            {s}{s !== "all" && counts[s] ? ` (${counts[s]})` : ""}
          </button>
        ))}
        <label className="flex items-center gap-2 text-sm ml-2"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Assigned to me</label>
        <input className="border p-2 rounded-lg text-sm ml-auto outline-none focus:border-fuchsia-500" placeholder="Search subject" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className={`${box} lg:col-span-2 divide-y divide-gray-50 max-h-[640px] overflow-y-auto`}>
          {loading && <p className="p-8 text-center text-gray-400 text-sm">Loading…</p>}
          {!loading && items.length === 0 && <p className="p-8 text-center text-gray-400 text-sm">No tickets here.</p>}
          {items.map((t) => (
            <button key={t.id} onClick={() => show(t.id)} className={`w-full text-left p-4 hover:bg-gray-50 ${open?.id === t.id ? "bg-fuchsia-50" : ""}`}>
              <div className="flex justify-between gap-2"><span className="font-medium line-clamp-1">{t.subject}</span>{t.priority === "high" && <span className="text-xs font-semibold text-red-600">HIGH</span>}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.user ?? "Member"} · {t.category} · {new Date(t.lastMessageAt).toLocaleString("en-IN")}</div>
              <div className="flex items-center gap-2 mt-1"><span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${STATUS_STYLE[t.status]}`}>{t.status}</span>{t.assignedLabel && <span className="text-xs text-gray-400">→ {t.assignedLabel}</span>}</div>
            </button>
          ))}
        </div>

        <div className={`${box} lg:col-span-3 p-5`}>
          {!open ? <p className="text-sm text-gray-400 text-center py-16">Select a ticket.</p> : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-lg font-semibold">{open.subject}</h2><div className="text-xs text-gray-500">{open.user} · {open.category} · opened {new Date(open.createdAt).toLocaleDateString("en-IN")}</div></div>
                <div className="flex flex-wrap gap-2">
                  <select value={open.priority} onChange={(e) => update({ priority: e.target.value as "low" | "normal" | "high" })} className="border rounded-lg px-2 py-1.5 text-sm"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select>
                  <select value={open.status} onChange={(e) => update({ status: e.target.value as TicketStatus })} className="border rounded-lg px-2 py-1.5 text-sm"><option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
                  {open.assignedTo ? <button onClick={() => update({ assignedTo: null })} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm">Unassign ({open.assignedLabel})</button> : <button onClick={() => update({ assignedTo: "me" })} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm">Assign to me</button>}
                </div>
              </div>
              <TicketThread tone="light" ticket={open} disabled={open.status === "closed"} onSend={async (b) => { const m = await supportAdmin.reply(open.id, b); await load(); return m; }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
