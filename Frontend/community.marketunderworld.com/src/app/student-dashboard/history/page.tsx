"use client"

import { SignInNotice } from "@/components/nightlife/sign-in-notice"
import { EnrollmentRow } from "@/components/education/enrollment-row"
import { useMyEnrollments } from "@/components/education/use-enrollments"
import { sessionEnd } from "@/lib/api/education"

export default function StudentHistoryPage() {
  const { items, loading, needsLogin, error } = useMyEnrollments()
  if (needsLogin) return <SignInNotice next="/student-dashboard/history" what="see your history" />
  const past = items.filter((e) => e.session && sessionEnd(e.session) < new Date() && e.status === "approved")

  return (
    <div className="max-w-4xl space-y-6 text-white">
      <h1 className="text-3xl font-bold">History</h1>
      <p className="text-gray-400">Sessions you attended. You can review a teacher once a session has finished.</p>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-gray-500">Loading…</p>}
      {!loading && past.length === 0 && <p className="text-gray-500">Nothing here yet.</p>}
      <div className="space-y-3">{past.map((e) => <EnrollmentRow key={e.id} enrollment={e} />)}</div>
    </div>
  )
}
