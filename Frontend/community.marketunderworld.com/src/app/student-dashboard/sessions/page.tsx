"use client"

import { SignInNotice } from "@/components/nightlife/sign-in-notice"
import { EnrollmentRow } from "@/components/education/enrollment-row"
import { useMyEnrollments } from "@/components/education/use-enrollments"

export default function StudentSessionsPage() {
  const { items, loading, needsLogin, error, cancel } = useMyEnrollments()
  if (needsLogin) return <SignInNotice next="/student-dashboard/sessions" what="see your sessions" />

  return (
    <div className="max-w-4xl space-y-6 text-white">
      <h1 className="text-3xl font-bold">My sessions</h1>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {loading && <p className="text-gray-500">Loading…</p>}
      {!loading && items.length === 0 && <p className="text-gray-500">No requests yet.</p>}
      <div className="space-y-3">{items.map((e) => <EnrollmentRow key={e.id} enrollment={e} onCancel={cancel} />)}</div>
    </div>
  )
}
