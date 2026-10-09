"use client"

import Link from "next/link"
import { SignInNotice } from "@/components/nightlife/sign-in-notice"
import { EnrollmentRow } from "@/components/education/enrollment-row"
import { useMyEnrollments } from "@/components/education/use-enrollments"
import { sessionEnd } from "@/lib/api/education"

export default function StudentOverviewPage() {
  const { items, loading, needsLogin, error, cancel } = useMyEnrollments()
  const upcoming = items.filter((e) => e.session && sessionEnd(e.session) > new Date() && (e.status === "approved" || e.status === "requested"))
  const approved = upcoming.filter((e) => e.status === "approved")
  const pending = upcoming.filter((e) => e.status === "requested")

  if (needsLogin) return <SignInNotice next="/student-dashboard" what="see your sessions" />

  return (
    <div className="max-w-4xl space-y-10 text-white">
      <div>
        <h1 className="text-3xl font-bold">Your learning</h1>
        <p className="text-gray-400 mt-1">Sessions you have requested or been approved for.</p>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-gray-500">Loading…</p>}

      {!loading && !error && upcoming.length === 0 && (
        <div className="p-10 rounded-xl border border-white/10 bg-white/[0.02] text-center space-y-3">
          <p className="text-gray-400">You have no upcoming sessions.</p>
          <Link href="/education" className="inline-block h-11 leading-[2.75rem] px-6 rounded-lg bg-cyan-500 text-black font-bold">Browse teachers</Link>
        </div>
      )}

      {approved.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Approved</h2>
          {approved.map((e) => <EnrollmentRow key={e.id} enrollment={e} onCancel={cancel} />)}
        </section>
      )}
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Waiting for the teacher</h2>
          {pending.map((e) => <EnrollmentRow key={e.id} enrollment={e} onCancel={cancel} />)}
        </section>
      )}
    </div>
  )
}
