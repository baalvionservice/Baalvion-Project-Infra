"use client"

import { useEffect, useRef, useState } from "react"
import type { TicketDetail, TicketMessage } from "@/lib/api/staff"

// One conversation, shared by the member page and the admin console. `tone` only changes colours.
export function TicketThread({ ticket, onSend, tone = "dark", disabled }: {
  ticket: TicketDetail
  onSend: (body: string) => Promise<TicketMessage>
  tone?: "dark" | "light"
  disabled?: boolean
}) {
  const [messages, setMessages] = useState(ticket.messages)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const bottom = useRef<HTMLDivElement>(null)
  const light = tone === "light"

  useEffect(() => { setMessages(ticket.messages) }, [ticket])
  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest" }) }, [messages])

  const send = async () => {
    const body = text.trim()
    if (!body) return
    setSending(true)
    setError("")
    try {
      const m = await onSend(body)
      setMessages((prev) => [...prev, m])
      setText("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.fromStaff ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${m.fromStaff ? (light ? "bg-fuchsia-600 text-white" : "bg-cyan-500/20 border border-cyan-500/30 text-white") : (light ? "bg-gray-100" : "bg-white/5 border border-white/10 text-gray-100")}`}>
              <div className={`text-[10px] mb-0.5 ${light && !m.fromStaff ? "text-gray-500" : "opacity-60"}`}>{m.sender ?? "Member"} · {new Date(m.createdAt).toLocaleString("en-IN")}</div>
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {error && <p role="alert" className={`text-xs ${light ? "text-red-600" : "text-red-400"}`}>{error}</p>}
      <div className="flex gap-2">
        <textarea
          rows={2}
          value={text}
          maxLength={4000}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? "This ticket is closed" : "Write a reply…"}
          className={`flex-1 rounded-lg p-3 text-sm outline-none ${light ? "border focus:border-fuchsia-500" : "bg-white/5 border border-white/10 text-white focus:border-cyan-500/50"}`}
        />
        <button onClick={send} disabled={sending || disabled} className={`px-5 rounded-lg text-sm font-bold disabled:opacity-50 ${light ? "bg-fuchsia-600 text-white" : "bg-cyan-500 text-black"}`}>{sending ? "…" : "Send"}</button>
      </div>
    </div>
  )
}
