import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Star, MapPin } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Avatar } from "@/components/education/teacher-tile"
import { getTeacher } from "@/lib/api/education"
import { ReviewForm, SessionRow } from "./session-actions"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const t = await getTeacher(id)
  if (!t) return { title: "Teacher not found" }
  return { title: `${t.name} — ${t.subject} | Market Underworld`, description: t.bio }
}

export default async function TeacherPage({ params }: Props) {
  const { id } = await params
  const teacher = await getTeacher(id)
  if (!teacher) notFound()

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      <main className="container max-w-5xl mx-auto px-6 pt-40 pb-32 space-y-12">
        <header className="flex flex-col sm:flex-row gap-6 items-start">
          <Avatar name={teacher.name} url={teacher.avatarUrl} size={96} />
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">{teacher.name}</h1>
            <p className="text-brand-green text-lg">{teacher.subject}</p>
            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {teacher.country}</span>
              <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400" /> {teacher.rating !== null ? `${teacher.rating} from ${teacher.reviewCount} review${teacher.reviewCount === 1 ? "" : "s"}` : "No reviews yet"}</span>
              <span>{teacher.classesGiven} session{teacher.classesGiven === 1 ? "" : "s"} held</span>
              <span>{teacher.priceNote ?? "Ask the teacher about pricing"}</span>
            </div>
            {teacher.tags.length > 0 && <div className="flex flex-wrap gap-2 pt-1">{teacher.tags.map((t) => <span key={t} className="px-2 py-0.5 rounded bg-brand-surface border border-brand-border text-xs text-text-secondary">{t}</span>)}</div>}
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">About</h2>
          <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{teacher.longBio || teacher.bio}</p>
        </section>

        {(teacher.skills.length > 0 || teacher.education.length > 0) && (
          <section className="grid md:grid-cols-2 gap-8">
            {teacher.skills.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">Skills</h2>
                {teacher.skills.map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-sm"><span>{s.name}</span><span className="text-text-muted">{s.level}%</span></div>
                    <div className="h-1.5 bg-brand-surface rounded"><div className="h-full bg-brand-green rounded" style={{ width: `${s.level}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
            {teacher.education.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">Education</h2>
                {teacher.education.map((e, i) => <div key={i} className="text-sm"><div className="font-bold text-white">{e.degree}</div><div className="text-text-muted">{e.institution}{e.year ? ` · ${e.year}` : ""}</div></div>)}
              </div>
            )}
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">Upcoming sessions</h2>
          {teacher.sessions.length === 0 ? <p className="text-text-muted text-sm">No sessions scheduled right now.</p> : teacher.sessions.map((s) => <SessionRow key={s.id} session={s} />)}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">Reviews</h2>
          {teacher.reviews.length === 0 ? <p className="text-text-muted text-sm">No reviews yet.</p> : teacher.reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-lg bg-brand-surface border border-brand-border">
              <div className="flex items-center gap-2 text-sm"><Star className="w-4 h-4 text-yellow-400" /> {r.rating}/5 <span className="text-text-muted">· {r.student ?? "Student"}</span></div>
              {r.comment && <p className="text-sm text-text-secondary mt-1">{r.comment}</p>}
            </div>
          ))}
          <ReviewForm teacherId={teacher.id} />
        </section>
      </main>
      <Footer />
    </div>
  )
}
