"use client"

import { useState } from "react"
import Link from "next/link"
import { edu, ApiError, formatWhen, type Session } from "@/lib/api/education"

export function SessionRow({ session }: { session: Session }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")
  const [error, setError] = useState<{ message: string; login: boolean } | null>(null)

  const request = async () => {
    setError(null)
    setState("sending")
    try {
      await edu.enroll(session.id)
      setState("sent")
    } catch (err) {
      setState("idle")
      const status = err instanceof ApiError ? err.status : 0
      setError({ message: status === 401 ? "Sign in to request a place." : err instanceof Error ? err.message : "Could not send your request.", login: status === 401 })
    }
  }

  return (
    <div className="p-4 rounded-lg bg-brand-surface border border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <div className="font-bold text-white">{session.title}</div>
        <div className="text-xs text-text-muted">{formatWhen(session.startAt)} · {session.durationMin} min · up to {session.capacity} students</div>
        {session.description && <p className="text-sm text-text-secondary mt-1">{session.description}</p>}
      </div>
      <div className="shrink-0 text-right space-y-1">
        {state === "sent" ? (
          <span className="text-sm text-brand-green font-bold">Request sent. The teacher will approve or decline.</span>
        ) : (
          <button onClick={request} disabled={state === "sending"} className="h-10 px-5 rounded-md bg-brand-green text-brand-void font-bold text-sm disabled:opacity-60">
            {state === "sending" ? "Sending…" : "Request a place"}
          </button>
        )}
        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error.message} {error.login && <Link href="/auth/signin?redirect=/education" className="underline font-bold">Sign in</Link>}
          </p>
        )}
      </div>
    </div>
  )
}

export function ReviewForm({ teacherId }: { teacherId: string }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [sending, setSending] = useState(false)

  const submit = async () => {
    setSending(true)
    setMsg(null)
    try {
      await edu.review(teacherId, rating, comment || undefined)
      setMsg({ text: "Thanks, your review was saved. It appears after a refresh.", ok: true })
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "Could not save your review.", ok: false })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-5 rounded-lg bg-brand-surface border border-brand-border space-y-3">
      <h3 className="font-bold text-white">Leave a review</h3>
      <p className="text-xs text-text-muted">Available after a session you were approved for has finished.</p>
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="h-10 bg-brand-void border border-brand-border rounded-md px-3 text-white">
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
      </select>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={1500} placeholder="What was it like?" className="w-full bg-brand-void border border-brand-border rounded-md p-3 text-white outline-none focus:border-brand-green" />
      {msg && <p role="alert" className={`text-sm ${msg.ok ? "text-brand-green" : "text-red-400"}`}>{msg.text}</p>}
      <button onClick={submit} disabled={sending} className="h-10 px-5 rounded-md bg-brand-green text-brand-void font-bold text-sm disabled:opacity-60">{sending ? "Saving…" : "Submit review"}</button>
    </div>
  )
}
