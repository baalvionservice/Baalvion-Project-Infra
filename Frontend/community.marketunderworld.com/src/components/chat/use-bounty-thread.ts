"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { bounty, type ThreadMessage } from "@/lib/api/bounty"

const POLL_MS = 5000

// Loads the hunter's private admin thread and polls for new messages while `active`.
// Polling (not a socket) on purpose: realtime-service rooms are community-membership based,
// and this thread is a one-to-one support channel that does not need sub-second delivery.
export function useBountyThread(active: boolean) {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const lastAt = useRef<string | undefined>(undefined)

  const merge = useCallback((incoming: ThreadMessage[]) => {
    if (!incoming.length) return
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id))
      return [...prev, ...incoming.filter((m) => !seen.has(m.id))]
    })
    lastAt.current = incoming[incoming.length - 1].createdAt
  }, [])

  useEffect(() => {
    if (!active) return
    let stopped = false
    const tick = async () => {
      try {
        const next = await bounty.thread(lastAt.current)
        if (!stopped) {
          setError("")
          merge(next)
        }
      } catch (err) {
        if (!stopped) setError(err instanceof Error ? err.message : "Could not load messages")
      }
    }
    tick()
    const timer = setInterval(tick, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [active, merge])

  const send = async (content: string) => {
    setSending(true)
    try {
      const sent = await bounty.send(content)
      setError("")
      merge([sent])
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send")
      return false
    } finally {
      setSending(false)
    }
  }

  return { messages, error, sending, send }
}
