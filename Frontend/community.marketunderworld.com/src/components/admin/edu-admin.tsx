"use client";

import { useCallback, useEffect, useState } from "react";
import { eduAdmin, formatWhen, type Session, type Teacher } from "@/lib/api/education";

const box = "bg-white rounded-xl shadow-sm border border-gray-100";
const msg = (e: unknown, f: string) => (e instanceof Error ? e.message : f);

const STATUS_STYLE: Record<Teacher["status"], string> = {
  pending: "bg-amber-100 text-amber-800", active: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800", suspended: "bg-gray-200 text-gray-700",
};

export function TeacherReview({ initial }: { initial: Teacher["status"] | "all" }) {
  const [filter, setFilter] = useState<Teacher["status"] | "all">(initial);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setError("");
      setTeachers(await eduAdmin.teachers(filter === "all" ? undefined : filter));
    } catch (e) { setError(msg(e, "Could not load teachers")); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const decide = async (t: Teacher, status: "active" | "rejected" | "suspended") => {
    let note: string | undefined;
    if (status !== "active") {
      note = window.prompt(status === "rejected" ? "Reason for rejecting (shown to the applicant):" : "Reason for suspending:")?.trim();
      if (!note) return;
    }
    try { await eduAdmin.reviewTeacher(t.id, status, note); await load(); } catch (e) { setError(msg(e, "Could not save decision")); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teachers</h1>
        <p className="text-gray-500 mt-2">Approve applicants before they appear on the Education page. Check their bio and links first.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(["pending", "active", "rejected", "suspended", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm capitalize border ${filter === f ? "bg-fuchsia-600 text-white border-fuchsia-600" : "bg-white border-gray-200 text-gray-600"}`}>{f}</button>
        ))}
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-gray-400">Loading…</p>}
      {!loading && teachers.length === 0 && <p className={`${box} p-8 text-center text-gray-400 text-sm`}>No teachers.</p>}
      {teachers.map((t) => (
        <div key={t.id} className={`${box} p-5 space-y-3`}>
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <div className="font-semibold text-lg">{t.name} <span className="text-gray-500 font-normal">· {t.subject}</span></div>
              <div className="text-xs text-gray-500">{t.country} ({t.regionId.toUpperCase()}) · {t.priceNote ?? "no price note"} · applied {new Date(t.memberSince).toLocaleDateString("en-IN")}</div>
            </div>
            <span className={`px-2 py-1 h-fit rounded-md text-xs font-semibold uppercase ${STATUS_STYLE[t.status]}`}>{t.status}</span>
          </div>
          <p className="text-sm">{t.bio}</p>
          {t.longBio && <p className="text-sm text-gray-600 whitespace-pre-wrap">{t.longBio}</p>}
          {t.avatarUrl && <a href={t.avatarUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-blue-600 underline break-all">{t.avatarUrl}</a>}
          {t.reviewNote && <p className="text-xs text-gray-500">Last note: {t.reviewNote}</p>}
          <div className="flex gap-2">
            {t.status !== "active" && <button onClick={() => decide(t, "active")} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium">{t.status === "suspended" ? "Reinstate" : "Approve"}</button>}
            {t.status === "pending" && <button onClick={() => decide(t, "rejected")} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium">Reject</button>}
            {t.status === "active" && <button onClick={() => decide(t, "suspended")} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium">Suspend</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SessionsAdmin() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setError(""); setSessions(await eduAdmin.sessions()); } catch (e) { setError(msg(e, "Could not load sessions")); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const cancel = async (s: Session) => {
    if (!confirm(`Cancel "${s.title}"? Use this for sessions that break the rules.`)) return;
    try { await eduAdmin.cancelSession(s.id); await load(); } catch (e) { setError(msg(e, "Could not cancel")); }
  };

  const now = Date.now();
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sessions</h1>
        <p className="text-gray-500 mt-2">Every scheduled session across all teachers. Sessions run on each teacher&apos;s own video link.</p>
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className={`${box} divide-y divide-gray-50`}>
        {sessions.length === 0 && <p className="p-8 text-center text-gray-400 text-sm">No sessions.</p>}
        {sessions.map((s) => {
          const start = new Date(s.startAt).getTime();
          const live = s.status === "scheduled" && start <= now && now < start + s.durationMin * 60000;
          return (
            <div key={s.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="font-medium">{s.title} {live && <span className="ml-2 text-xs font-semibold text-red-600">LIVE NOW</span>}</div>
                <div className="text-sm text-gray-500">{s.teacher?.name} · {formatWhen(s.startAt)} · {s.durationMin} min · capacity {s.capacity}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md text-xs font-semibold uppercase bg-gray-100">{s.status}</span>
                {s.status === "scheduled" && <button onClick={() => cancel(s)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50">Cancel</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
