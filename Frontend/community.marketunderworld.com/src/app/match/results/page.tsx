"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { Avatar } from "@/components/education/teacher-tile"
import type { Teacher } from "@/lib/api/education"

interface Answers { subject: string[]; goal: string | null }

// Quiz subject ids -> words to look for in a teacher's subject or tags.
const SUBJECT_WORDS: Record<string, string[]> = {
  math: ["math"], chem: ["chem"], phys: ["phys"], code: ["cod", "program", "develop", "software"],
  lang: ["language", "english", "hindi", "spanish", "french", "german"], data: ["data"], music: ["music", "piano", "guitar", "vocal"],
  design: ["design"], trade: ["trad", "financ", "invest"], write: ["writ", "english"], biz: ["business", "mba", "market"],
}

function readAnswers(): Answers {
  try {
    const raw = sessionStorage.getItem("match_answers")
    if (raw) return JSON.parse(raw) as Answers
  } catch { /* storage blocked or unreadable: treat as no answers */ }
  return { subject: [], goal: null }
}

export default function MatchResults() {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null)
  const [answers, setAnswers] = useState<Answers>({ subject: [], goal: null })

  useEffect(() => {
    setAnswers(readAnswers())
    fetch("/api/community-proxy/edu/teachers?limit=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => setTeachers(body?.success ? body.data.items : []))
      .catch(() => setTeachers([]))
  }, [])

  const ranked = useMemo(() => {
    if (!teachers) return []
    const words = answers.subject.flatMap((s) => SUBJECT_WORDS[s] ?? [])
    const scored = teachers.map((t) => {
      const hay = [t.subject, ...t.tags].join(" ").toLowerCase()
      const hits = words.filter((w) => hay.includes(w))
      return { teacher: t, matched: hits.length > 0, rating: t.rating ?? 0 }
    })
    const matches = scored.filter((s) => s.matched)
    // With no subject picked (or "other"), show everyone rather than an empty page.
    const pool = words.length === 0 ? scored : matches
    return pool.sort((a, b) => b.rating - a.rating || b.teacher.reviewCount - a.teacher.reviewCount)
  }, [teachers, answers])

  return (
    <div className="p-8 pb-32 max-w-5xl mx-auto space-y-10 text-white">
      <header className="pt-12 space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Teachers that fit your answers</h1>
        <p className="text-gray-500">Approved teachers whose subject matches what you picked, best rated first.</p>
        <Link href="/match/quiz"><NexusButton variant="outline" className="border-white/10">Retake quiz</NexusButton></Link>
      </header>

      {teachers === null && <p className="text-gray-500">Loading…</p>}
      {teachers !== null && ranked.length === 0 && (
        <div className="p-10 rounded-2xl border border-white/10 bg-white/[0.02] text-center space-y-4">
          <p className="text-gray-400">No approved teacher covers those subjects yet.</p>
          <Link href="/education"><NexusButton>Browse all teachers</NexusButton></Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {ranked.map(({ teacher, matched }) => (
          <NexusCard key={teacher.id} className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <Avatar name={teacher.name} url={teacher.avatarUrl} />
              <div>
                <h3 className="font-bold text-lg">{teacher.name}</h3>
                <p className="text-cyan-400 text-sm">{teacher.subject}</p>
                <p className="text-xs text-gray-500">{teacher.country}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 line-clamp-3">{teacher.bio}</p>
            <ul className="text-xs text-gray-500 space-y-1">
              {matched && <li>• Teaches a subject you picked</li>}
              <li className="flex items-center gap-1">• <Star className="w-3 h-3 text-yellow-400" /> {teacher.rating !== null ? `${teacher.rating} from ${teacher.reviewCount} review(s)` : "No reviews yet"}</li>
              {teacher.isLive && <li>• Live right now</li>}
            </ul>
            <Link href={`/education/teacher/${teacher.id}`}><NexusButton className="w-full">View profile & sessions</NexusButton></Link>
          </NexusCard>
        ))}
      </div>
    </div>
  )
}
