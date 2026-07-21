"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { MessageCircle, Send, Loader2 } from "lucide-react"
import {
  listConversations,
  listMessages,
  sendDirectMessage,
  startConversation,
  type DirectConversation,
  type DirectMessage,
} from "@/lib/api/messages"

const POLL_INTERVAL_MS = 4000;

function MessagesInner() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshConversations = useCallback(() => {
    listConversations().then(setConversations).catch(() => {});
  }, []);

  // Deep-link entry point: /messages?with=<userId>&label=Seller%20of%20X — used by "Message
  // Seller" buttons elsewhere in the app (product.createdBy is the seller's user id).
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const withUserId = searchParams.get("with");
    if (withUserId) {
      startConversation(withUserId, searchParams.get("label") || undefined)
        .then((conv) => { setActiveId(conv.id); refreshConversations(); })
        .catch((err) => toast({ variant: "destructive", title: "Couldn't start conversation", description: err instanceof Error ? err.message : "Please try again." }));
    } else {
      setLoadingList(true);
      listConversations()
        .then((convs) => { setConversations(convs); if (convs.length > 0) setActiveId(convs[0].id); })
        .catch(() => {})
        .finally(() => setLoadingList(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!activeId) return;
    setLoadingMessages(true);
    listMessages(activeId).then(setMessages).catch(() => {}).finally(() => setLoadingMessages(false));

    const interval = setInterval(() => {
      listMessages(activeId).then(setMessages).catch(() => {});
      refreshConversations();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeId, refreshConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!activeId || !draft.trim()) return;
    setSending(true);
    try {
      const message = await sendDirectMessage(activeId, draft.trim());
      setMessages((prev) => [...prev, message]);
      setDraft("");
      refreshConversations();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't send message", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setSending(false);
    }
  };

  if (authLoading) {
    return <div className="h-screen flex items-center justify-center bg-[#0A0A0F] text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex flex-col bg-[#0A0A0F]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-500">Sign in to view your messages.</div>
      </div>
    );
  }

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0F] overflow-hidden">
      <Navbar />
      <main className="flex-1 flex pt-20 overflow-hidden">
        <div className="w-[280px] shrink-0 h-full border-r border-white/5 overflow-y-auto">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Messages</h2>
          </div>
          {loadingList ? (
            <div className="p-6 flex justify-center text-gray-600"><Loader2 className="w-4 h-4 animate-spin" /></div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-600 text-sm">No conversations yet.</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left p-4 border-b border-white/5 transition-colors ${activeId === c.id ? "bg-white/5" : "hover:bg-white/[0.02]"}`}
              >
                <div className="text-sm font-bold text-white truncate">{c.contextLabel || `User ${c.otherUserId.slice(0, 8)}`}</div>
                <div className="text-xs text-gray-500 truncate mt-1">{c.lastMessage?.content || "No messages yet"}</div>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 h-full flex flex-col overflow-hidden">
          {!activeId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3">
              <MessageCircle className="w-10 h-10" />
              <p>Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/5">
                <div className="text-sm font-bold text-white">{activeConversation?.contextLabel || "Conversation"}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center text-gray-600"><Loader2 className="w-4 h-4 animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-600 text-sm">No messages yet — say hello.</div>
                ) : (
                  messages.map((m) => {
                    const mine = String(m.senderId) === String(user?.id);
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-md px-4 py-3 rounded-2xl text-sm ${mine ? "bg-cyan-500/20 text-white" : "bg-white/5 text-gray-300"}`}>
                          {m.content}
                          <div className="text-[9px] text-gray-500 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>
              <div className="p-4 border-t border-white/5 flex gap-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 h-11 text-sm text-white outline-none focus:border-cyan-500/50"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  className="w-11 h-11 rounded-xl bg-cyan-500 text-black flex items-center justify-center disabled:opacity-40"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#0A0A0F] text-gray-500">Loading…</div>}>
      <MessagesInner />
    </Suspense>
  );
}
