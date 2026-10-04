"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Skull, Send, ChevronLeft, Shield, Zap } from "lucide-react"
import { useBountyThread } from "@/components/chat/use-bounty-thread"
import { useAuth } from "@/context/auth-context"

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

export default function BountyChatPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [input, setInput] = useState("")
  const { messages, error, sending, send } = useBountyThread(isAuthenticated)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/auth/signin?redirect=/bounty/chat")
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    if (await send(text)) setInput("")
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const handle = user?.email?.split("@")[0] ?? "Hunter"

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col">

      {/* Chat Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0F]/95 backdrop-blur-md border-b border-red-900/40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/bounty" className="p-2 text-gray-500 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-600 flex items-center justify-center shadow-[0_0_12px_rgba(220,38,38,0.4)]">
            <Skull className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">Admin — Bug Bounty HQ</div>
            <span className="text-[10px] text-gray-500 font-mono uppercase">Replies are not instant</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Private</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="bg-black/40 border border-[#1E2028] rounded-xl px-4 py-2 flex items-center gap-3">
            <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="text-[11px] text-gray-300 font-mono">
              Use this chat for questions. Submit vulnerabilities as a formal report from the <Link href="/bounty" className="underline text-yellow-400">Bounty page</Link> so they are tracked.
            </span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto pt-36 pb-32 max-w-4xl mx-auto w-full px-4 space-y-4">
        {messages.length === 0 && !error && (
          <p className="text-center text-sm text-gray-600 pt-10">No messages yet. Say hello — the admin team will reply here.</p>
        )}
        {error && <p role="alert" className="text-center text-sm text-red-400">{error}</p>}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.fromAdmin ? "flex-row" : "flex-row-reverse"}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold
                ${msg.fromAdmin
                  ? "bg-red-950 border border-red-600 text-red-400"
                  : "bg-[#1A1D24] border border-[#252A33] text-gray-300"}`}>
                {msg.fromAdmin ? <Skull className="w-4 h-4 text-red-500" /> : handle[0].toUpperCase()}
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] space-y-1 ${msg.fromAdmin ? "items-start" : "items-end"} flex flex-col`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
                  ${msg.fromAdmin
                    ? "bg-[#13151A] border border-red-900/40 text-gray-100 rounded-tl-sm"
                    : "bg-red-600/20 border border-red-500/30 text-white rounded-tr-sm"}`}>
                  {msg.content}
                </div>
                <span className="text-[9px] text-gray-600 font-mono px-1">{timeOf(msg.createdAt)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0A0A0F]/95 backdrop-blur-md border-t border-red-900/30 p-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the admin team a question..." maxLength={4000}
            className="flex-1 bg-black/60 border border-[#252A33] focus:border-red-500/60 rounded-2xl px-5 py-3.5 text-sm text-white outline-none transition-all placeholder:text-gray-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-12 h-12 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center text-white transition-all shrink-0 shadow-[0_0_12px_rgba(220,38,38,0.3)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-[9px] text-gray-700 mt-2 font-mono uppercase tracking-wider max-w-4xl mx-auto">
          All messages are logged · Only you and admin can see this chat
        </p>
      </footer>
    </div>
  )
}
