"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { TeacherTile } from "@/components/education/teacher-tile"
import { formatWhen, type Session, type Teacher } from "@/lib/api/education"

export function EducationClient({ teachers, sessions, initialRegion }: { teachers: Teacher[]; sessions: Session[]; initialRegion?: string }) {
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState(initialRegion ?? "all")

  const regions = useMemo(() => Array.from(new Set(teachers.map((t) => t.regionId))).sort(), [teachers])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teachers.filter((t) => {
      const regionOk = region === "all" || t.regionId === region
      const textOk = !q || t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.tags.some((x) => x.toLowerCase().includes(q))
      return regionOk && textOk
    })
  }, [teachers, query, region])

  const now = Date.now()

  return (
    <>
      {sessions.length > 0 && (
        <section className="mb-16">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Upcoming sessions</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sessions.slice(0, 6).map((s) => (
              <Link key={s.id} href={`/education/teacher/${s.teacherId}`} className="p-4 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-green transition-colors">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  {new Date(s.startAt).getTime() <= now ? <span className="text-red-400">Live now</span> : <span className="text-brand-green">{formatWhen(s.startAt)}</span>}
                </div>
                <div className="font-bold text-white mt-1">{s.title}</div>
                <div className="text-xs text-text-muted">{s.teacher?.name} · {s.teacher?.subject}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col md:flex-row gap-3 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teachers or subjects"
            className="w-full h-12 bg-brand-surface border border-brand-border rounded-md pl-11 pr-4 text-white outline-none focus:border-brand-green"
          />
        </div>
        <select value={region} onChange={(e) => setRegion(e.target.value)} className="h-12 bg-brand-surface border border-brand-border rounded-md px-4 text-white outline-none focus:border-brand-green">
          <option value="all">All regions</option>
          {regions.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 rounded-lg border border-brand-border bg-brand-surface">
          <h3 className="text-xl font-bold text-white mb-2">{teachers.length === 0 ? "No teachers yet" : "No teachers match your search"}</h3>
          <p className="text-text-muted text-sm mb-6">
            {teachers.length === 0 ? "Teachers appear here once an admin has approved their application." : "Try a different subject or region."}
          </p>
          {teachers.length === 0 && <Link href="/teacher-dashboard" className="text-brand-green underline text-sm">Apply to teach</Link>}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => <TeacherTile key={t.id} teacher={t} />)}
        </div>
      )}
    </>
  )
}
