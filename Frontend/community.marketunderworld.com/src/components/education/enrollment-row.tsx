"use client"

import Link from "next/link"
import { formatWhen, sessionEnd, type Enrollment } from "@/lib/api/education"

const STATUS_STYLE: Record<Enrollment["status"], string> = {
  requested: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  approved: "text-green-300 border-green-500/30 bg-green-500/10",
  declined: "text-red-300 border-red-500/30 bg-red-500/10",
  cancelled: "text-gray-400 border-gray-500/30 bg-gray-500/10",
}

export function EnrollmentRow({ enrollment, onCancel }: { enrollment: Enrollment; onCancel?: (id: string) => void }) {
  const s = enrollment.session
  if (!s) return null
  const over = sessionEnd(s) < new Date()
  return (
    <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-white">{s.title}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLE[enrollment.status]}`}>{enrollment.status}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          <Link href={`/education/teacher/${s.teacherId}`} className="hover:text-white">{s.teacher?.name}</Link> · {formatWhen(s.startAt)} · {s.durationMin} min
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {enrollment.status === "approved" && s.meetingUrl && !over && (
          <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer" className="h-10 px-5 inline-flex items-center rounded-lg bg-cyan-500 text-black font-bold text-sm">Join session</a>
        )}
        {over && enrollment.status === "approved" && (
          <Link href={`/education/teacher/${s.teacherId}`} className="text-sm text-cyan-400 underline">Leave a review</Link>
        )}
        {onCancel && !over && (enrollment.status === "requested" || enrollment.status === "approved") && (
          <button onClick={() => onCancel(enrollment.id)} className="text-sm text-gray-400 hover:text-red-400 underline">Cancel</button>
        )}
      </div>
    </div>
  )
}
