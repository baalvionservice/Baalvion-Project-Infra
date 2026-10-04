"use client";

import { useCallback, useEffect, useState } from "react";
import { admin, type ApiClub, type ApiEvent, type EventTag } from "@/lib/api/nightlife";
import { ImageUpload } from "@/components/upload/image-upload";

const TAGS: EventTag[] = ["FREE ON GUEST LIST", "BUY TICKETS", "VIP TABLE", "SOLD OUT"];
const input = "w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500 text-sm";
const blank = (v: string) => (v.trim() ? v.trim() : undefined);

export default function AdminEventsPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [clubs, setClubs] = useState<ApiClub[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ clubId: "", eventName: "", djName: "", eventDate: "", tag: "FREE ON GUEST LIST" as EventTag, image: "", ticketUrl: "" });

  const load = useCallback(async () => {
    try {
      setError("");
      const [e, c] = await Promise.all([admin.events(), admin.clubs()]);
      setEvents(e.items);
      setClubs(c.items.filter((x) => x.status === "active"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load events");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.clubId || !form.eventName || !form.eventDate) return setError("Club, event name and date are required.");
    setSaving(true);
    try {
      setError("");
      await admin.createEvent({
        clubId: form.clubId, eventName: form.eventName, eventDate: form.eventDate, tag: form.tag,
        djName: blank(form.djName), image: blank(form.image), ticketUrl: blank(form.ticketUrl),
      });
      setForm({ ...form, eventName: "", djName: "", image: "", ticketUrl: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (e: ApiEvent, status: "active" | "cancelled") => {
    try { await admin.updateEvent(e.id, { status }); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Could not update event"); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Club Events</h1>
        <p className="text-gray-500 mt-2">Events appear on the public calendar. Only add events a venue has actually confirmed.</p>
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
        <h2 className="font-semibold">Add event</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <select className={input} value={form.clubId} onChange={(e) => setForm({ ...form, clubId: e.target.value })}>
            <option value="">Select club…</option>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
          </select>
          <input className={input} placeholder="Event name" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} />
          <input className={input} placeholder="DJ / artist (optional)" value={form.djName} onChange={(e) => setForm({ ...form, djName: e.target.value })} />
          <input type="date" className={input} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
          <select className={input} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value as EventTag })}>{TAGS.map((t) => <option key={t}>{t}</option>)}</select>
          <div className="md:col-span-1"><ImageUpload tone="light" allowLink label="Poster (optional)" purpose="event_poster" value={form.image} onChange={(url) => setForm({ ...form, image: url })} /></div>
          <input className={`${input} md:col-span-3`} placeholder="Ticket link (optional)" value={form.ticketUrl} onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })} />
        </div>
        <button onClick={create} disabled={saving} className="px-5 py-2.5 rounded-lg bg-fuchsia-600 text-white text-sm font-medium hover:bg-fuchsia-700 disabled:opacity-60">{saving ? "Saving…" : "Add event"}</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {events.length === 0 && <p className="p-8 text-center text-gray-400 text-sm">No events yet.</p>}
        {events.map((e) => (
          <div key={e.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="font-medium">{e.eventName} {e.djName && <span className="text-gray-500 font-normal">· {e.djName}</span>}</div>
              <div className="text-sm text-gray-500">{e.club?.name}, {e.club?.city} · {e.date} · {e.tag}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase ${e.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{e.status}</span>
              {e.status === "active"
                ? <button onClick={() => setStatus(e, "cancelled")} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50">Cancel</button>
                : <button onClick={() => setStatus(e, "active")} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50">Restore</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
