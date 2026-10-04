"use client";

import { useCallback, useEffect, useState } from "react";
import { announcementsAdmin, type Announcement, type Severity } from "@/lib/api/staff";

const box = "bg-white rounded-xl shadow-sm border border-gray-100";
const input = "w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500 text-sm";
const SEV: Record<Severity, string> = { info: "bg-blue-100 text-blue-800", warning: "bg-amber-100 text-amber-800", critical: "bg-red-100 text-red-800" };
const STATUS: Record<Announcement["status"], string> = { draft: "bg-gray-100 text-gray-600", published: "bg-green-100 text-green-800", archived: "bg-gray-200 text-gray-500" };
const msg = (e: unknown, f: string) => (e instanceof Error ? e.message : f);
// <input type="datetime-local"> gives local time without a zone; the API wants an ISO instant.
const iso = (v: string) => (v ? new Date(v).toISOString() : undefined);

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", severity: "info" as Severity, linkUrl: "", startsAt: "", endsAt: "" });

  const load = useCallback(async () => { try { setError(""); setItems(await announcementsAdmin.list()); } catch (e) { setError(msg(e, "Could not load announcements")); } }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (publish: boolean) => {
    setSaving(true);
    setError("");
    try {
      const created = await announcementsAdmin.create({
        title: form.title, body: form.body, severity: form.severity, linkUrl: form.linkUrl || undefined,
        startsAt: iso(form.startsAt), endsAt: form.endsAt ? iso(form.endsAt) : undefined,
      });
      if (publish) await announcementsAdmin.update(created.id, { status: "published" });
      setForm({ title: "", body: "", severity: "info", linkUrl: "", startsAt: "", endsAt: "" });
      await load();
    } catch (e) { setError(msg(e, "Could not save the announcement")); } finally { setSaving(false); }
  };
  const setStatus = async (a: Announcement, status: Announcement["status"]) => {
    try { await announcementsAdmin.update(a.id, { status }); await load(); } catch (e) { setError(msg(e, "Could not update")); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-gray-500 mt-2">Published announcements show as a banner at the top of every public page, between their start and end time. Visitors can dismiss one; it comes back if you change it.</p>
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className={`${box} p-6 space-y-3`}>
        <h2 className="font-semibold">New announcement</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input className={`${input} md:col-span-2`} placeholder="Headline" maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className={input} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option></select>
        </div>
        <textarea className={input} rows={2} placeholder="Message (max 1000 characters)" maxLength={1000} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <div className="grid md:grid-cols-3 gap-3">
          <input className={input} placeholder="Link (optional): /support or https://…" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
          <label className="text-xs text-gray-500">Starts (blank = now)<input type="datetime-local" className={input} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label>
          <label className="text-xs text-gray-500">Ends (blank = until archived)<input type="datetime-local" className={input} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label>
        </div>
        <div className="flex gap-2">
          <button onClick={() => create(true)} disabled={saving} className="px-5 py-2.5 rounded-lg bg-fuchsia-600 text-white text-sm font-medium disabled:opacity-60">Publish now</button>
          <button onClick={() => create(false)} disabled={saving} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-60">Save as draft</button>
        </div>
      </div>

      <div className={`${box} divide-y divide-gray-50`}>
        {items.length === 0 && <p className="p-8 text-center text-gray-400 text-sm">No announcements yet.</p>}
        {items.map((a) => (
          <div key={a.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{a.title}</span><span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${SEV[a.severity]}`}>{a.severity}</span><span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${STATUS[a.status]}`}>{a.status}</span></div>
              <div className="text-sm text-gray-600">{a.body}</div>
              <div className="text-xs text-gray-400">From {new Date(a.startsAt).toLocaleString("en-IN")}{a.endsAt ? ` until ${new Date(a.endsAt).toLocaleString("en-IN")}` : ""}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              {a.status !== "published" && a.status !== "archived" && <button onClick={() => setStatus(a, "published")} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium">Publish</button>}
              {a.status === "published" && <button onClick={() => setStatus(a, "draft")} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium">Unpublish</button>}
              {a.status !== "archived" && <button onClick={() => setStatus(a, "archived")} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium">Archive</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
