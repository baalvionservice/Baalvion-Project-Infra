"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, MessageSquare, Send } from 'lucide-react'
import { ListingCard, Badge } from '@/components/ui/ListingCard'
import { AppButton } from '@/components/ui/AppButton'
import { useToast } from '@/hooks/use-toast'
import {
  getChatSession,
  listChatSessions,
  sendAdminChatMessage,
  type AdminChatSession,
  type ChatMessage,
} from '@/lib/api/seller-access'

export default function SellerChatPage() {
  const [sessions, setSessions] = useState<AdminChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(() => {
    listChatSessions().then((s) => { setSessions(s); setError(null) })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load')).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id) }, [load])

  return (
    <div className="p-10 space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Seller Chat</h1>
        <p className="text-text-muted font-medium">Sellers pay tokens for a timed window. You can reply only while a window is open; closed ones stay readable.</p>
      </header>

      {error ? (
        <ListingCard className="p-16 text-center border-brand-border bg-brand-surface text-semantic-error font-medium">{error}</ListingCard>
      ) : loading ? (
        <div className="p-16 flex items-center justify-center gap-3 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
      ) : sessions.length === 0 ? (
        <ListingCard className="p-16 text-center border-brand-border bg-brand-surface">
          <MessageSquare className="w-10 h-10 text-text-ghost mx-auto mb-4" />
          <p className="text-text-muted font-medium">No chats yet.</p>
        </ListingCard>
      ) : (
        <div className="grid lg:grid-cols-[340px_1fr] gap-6">
          <div className="space-y-2">
            {sessions.map((s) => (
              <button key={s.id} onClick={() => setOpenId(s.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${openId === s.id ? 'border-brand-green bg-brand-surface' : 'border-brand-border bg-brand-void hover:bg-brand-surface'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-bold text-sm">{s.memberNumber ?? `Seller #${s.sellerUserId}`}</span>
                  <Badge variant={s.isActive ? 'success' : 'default'} className="text-[8px]">{s.isActive ? 'live' : 'closed'}</Badge>
                </div>
                <p className="text-[11px] text-text-muted truncate mt-1">{s.lastMessage || 'No messages yet'}</p>
                <p className="text-[10px] text-text-ghost mt-1">{new Date(s.startsAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
          {openId ? <Conversation key={openId} sessionId={openId} /> : (
            <ListingCard className="p-16 text-center border-brand-border bg-brand-surface text-text-muted text-sm">Select a chat.</ListingCard>
          )}
        </div>
      )}
    </div>
  )
}

function Conversation({ sessionId }: { sessionId: string }) {
  const { toast } = useToast()
  const [session, setSession] = useState<AdminChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const lastRef = useRef<string | undefined>(undefined)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let stop = false
    const poll = async () => {
      try {
        const res = await getChatSession(sessionId, lastRef.current)
        if (stop) return
        setSession(res.session)
        if (!res.messages.length) return
        lastRef.current = res.messages[res.messages.length - 1].createdAt
        setMessages((m) => [...m, ...res.messages.filter((n) => !m.some((x) => x.id === n.id))])
      } catch { /* the next tick retries */ }
    }
    void poll()
    const id = setInterval(poll, 3000)
    return () => { stop = true; clearInterval(id) }
  }, [sessionId])

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setSending(true)
    try {
      const m = await sendAdminChatMessage(sessionId, body)
      setText(''); lastRef.current = m.createdAt
      setMessages((prev) => [...prev, m])
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't send", description: err instanceof Error ? err.message : 'Please try again.' })
    } finally { setSending(false) }
  }

  return (
    <ListingCard className="border-brand-border bg-brand-surface overflow-hidden">
      <div className="h-[420px] overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[75%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${m.senderRole === 'admin' ? 'bg-brand-green text-black' : 'bg-white/10 text-white'}`}>{m.body}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {session?.isActive ? (
        <form onSubmit={send} className="flex gap-2 p-3 border-t border-brand-border">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Reply"
            className="flex-1 h-10 px-3 rounded-lg bg-black border border-brand-border text-sm text-white" />
          <AppButton type="submit" disabled={sending || !text.trim()} aria-label="Send"><Send className="w-4 h-4" /></AppButton>
        </form>
      ) : (
        <p className="p-3 border-t border-brand-border text-xs text-text-ghost">This chat window has ended.</p>
      )}
    </ListingCard>
  )
}
