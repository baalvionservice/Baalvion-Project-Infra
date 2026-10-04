"use client";

import { useCallback, useEffect, useState } from "react";
import { audit, type AuditItem } from "@/lib/api/staff";

const box = "bg-white rounded-xl shadow-sm border border-gray-100";
const SEV: Record<AuditItem["severity"], string> = {
  info: "bg-blue-100 text-blue-800",
  warning: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800",
};

export default function StaffAuditLogs() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [last24h, setLast24h] = useState<Partial<Record<AuditItem["severity"], number>>>({});
  const [severity, setSeverity] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);

  const load = useCallback(async (append = false, before?: string) => {
    try {
      setError("");
      const res = await audit.list({ severity: severity || undefined, q: q.trim() || undefined, before, limit: 100 });
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
      setLast24h(res.last24h);
      setMore(res.items.length === 100);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load the audit log"); } finally { setLoading(false); }
  }, [severity, q]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => load(false), 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff audit log</h1>
        <p className="text-gray-500 mt-2">Every change staff make, who made it, from where, and when. Rows can&apos;t be edited or deleted. Failed attempts to use something above your level are recorded too.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(["critical", "warning", "info"] as const).map((s) => (
          <button key={s} onClick={() => setSeverity(severity === s ? "" : s)} className={`${box} p-5 text-left ${severity === s ? "ring-2 ring-fuchsia-500" : ""}`}>
            <div className="text-xs font-semibold uppercase text-gray-500">{s} · last 24h</div>
            <div className="text-3xl font-bold mt-1">{last24h[s] ?? 0}</div>
          </button>
        ))}
      </div>

      <input className="w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500 text-sm" placeholder="Search by person, action or summary" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className={`${box} overflow-x-auto`}>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-gray-100 text-gray-500"><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">What</th><th className="p-3">Level</th><th className="p-3">From</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nothing recorded yet.</td></tr>}
            {items.map((i) => (
              <tr key={i.id}>
                <td className="p-3 whitespace-nowrap text-gray-500">{new Date(i.at).toLocaleString("en-IN")}</td>
                <td className="p-3">{i.actor ?? i.actorId.slice(0, 8)}<div className="text-xs text-gray-400">{i.tier ?? "no staff level"}</div></td>
                <td className="p-3">{i.summary}<div className="text-xs text-gray-400">{i.action}{i.status && i.status >= 400 ? ` · HTTP ${i.status}` : ""}</div></td>
                <td className="p-3"><span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase ${SEV[i.severity]}`}>{i.severity}</span></td>
                <td className="p-3 text-gray-500 whitespace-nowrap">{i.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {more && <button onClick={() => load(true, items[items.length - 1]?.at)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Load older</button>}
    </div>
  );
}
