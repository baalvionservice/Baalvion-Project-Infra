"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Hash, Search, Send, Loader2, Wifi, WifiOff, Users } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card';
import { AccessGate } from '@/components/forums/access-gate';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  getCommunities,
  getCommunity,
  getChatMessages,
  postChatMessage,
  type Community,
  type CommunityDetail,
  type ChatMessage,
} from '@/lib/api/community';
import { communityChatClient } from '@/lib/realtime/community-chat-client';

function isMember(status: string | undefined): boolean {
  return status === 'approved' || status === 'paid';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<Community[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<CommunityDetail | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const joinedRoomRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/signin?redirect=/chat');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load the full room list once.
  useEffect(() => {
    if (!isAuthenticated) return;
    getCommunities().then((all) => {
      const forums = all.filter((c) => c.isForum);
      setRooms(forums);
      setRoomsLoading(false);
      if (forums.length > 0) setActiveSlug((prev) => prev ?? forums[0].slug);
    });
  }, [isAuthenticated]);

  // Connect the socket once, track connection state.
  useEffect(() => {
    if (!isAuthenticated) return;
    communityChatClient.connect().catch(() => {
      toast({ variant: 'destructive', title: 'Live chat unavailable', description: 'Showing message history only.' });
    });
    const offConn = communityChatClient.onConnectionChange(setWsConnected);
    return () => {
      offConn();
      communityChatClient.disconnect();
    };
  }, [isAuthenticated, toast]);

  // Fetch membership detail for the active room whenever it changes.
  useEffect(() => {
    if (!activeSlug) return;
    setActiveDetail(null);
    getCommunity(activeSlug).then(setActiveDetail);
  }, [activeSlug]);

  // Join/leave the socket room + load history whenever the active member room changes.
  useEffect(() => {
    if (!activeSlug || !activeDetail || !isMember(activeDetail.membership?.status)) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setMessagesLoading(true);

    if (joinedRoomRef.current && joinedRoomRef.current !== activeSlug) {
      communityChatClient.leaveRoom(joinedRoomRef.current);
    }

    communityChatClient
      .connect()
      .then(() => communityChatClient.joinRoom(activeSlug))
      .then(() => { joinedRoomRef.current = activeSlug; })
      .catch(() => { /* history still loads below even if live join fails */ });

    getChatMessages(activeSlug).then((history) => {
      if (cancelled) return;
      setMessages(history);
      setMessagesLoading(false);
    });

    return () => { cancelled = true; };
  }, [activeSlug, activeDetail]);

  // Live incoming messages, deduped against optimistic sends.
  useEffect(() => {
    return communityChatClient.onMessage((message) => {
      if (message.slug !== activeSlug) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });
  }, [activeSlug]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const filteredRooms = useMemo(
    () => rooms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [rooms, search]
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !activeSlug || sending) return;
    setSending(true);
    setDraft('');
    try {
      const sent = await postChatMessage(activeSlug, content);
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
    } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't send message", description: err instanceof Error ? err.message : 'Try again.' });
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black text-brand-green font-mono overflow-hidden">
      <Navbar />

      <main className="flex-1 flex pt-20 overflow-hidden">
        {/* Room list */}
        <aside className="w-[300px] shrink-0 h-full border-r border-brand-green/15 bg-[#050705] flex flex-col">
          <div className="p-4 border-b border-brand-green/15 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-green/70">
              <Terminal className="w-3.5 h-3.5" /> Channels
              <span className={cn('ml-auto flex items-center gap-1 text-[9px]', wsConnected ? 'text-brand-green' : 'text-red-500')}>
                {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {wsConnected ? 'live' : 'offline'}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-green/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="grep channels..."
                className="w-full bg-black border border-brand-green/20 h-9 rounded pl-8 pr-3 text-xs text-brand-green placeholder:text-brand-green/30 outline-none focus:border-brand-green/60"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mu-scrollbar">
            {roomsLoading ? (
              <div className="p-6 text-center text-xs text-brand-green/50">loading channels...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-6 text-center text-xs text-brand-green/50">no channels match "{search}"</div>
            ) : (
              filteredRooms.map((room) => (
                <button
                  key={room.slug}
                  onClick={() => setActiveSlug(room.slug)}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-3 text-left text-xs border-b border-brand-green/5 transition-colors',
                    activeSlug === room.slug ? 'bg-brand-green/10 text-white' : 'text-brand-green/70 hover:bg-brand-green/5 hover:text-brand-green'
                  )}
                >
                  <Hash className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="truncate flex-1">{room.name}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Active channel */}
        <div className="flex-1 h-full flex flex-col overflow-hidden bg-black">
          {!activeSlug || !activeDetail ? (
            <div className="flex-1 flex items-center justify-center text-brand-green/40 text-sm">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !isMember(activeDetail.membership?.status) ? (
            <div className="flex-1 flex items-center justify-center p-10">
              <div className="max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-white"># {activeDetail.name}</h2>
                  <p className="text-xs text-brand-green/60">Join this channel to see and send messages.</p>
                </div>
                <AccessGate community={activeDetail} onJoined={() => getCommunity(activeSlug).then(setActiveDetail)} />
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-3 border-b border-brand-green/15 flex items-center gap-3 bg-[#050705]">
                <Hash className="w-4 h-4 text-brand-green/60" />
                <span className="font-bold text-white text-sm">{activeDetail.name}</span>
                <NexusBadge variant="success" className="ml-auto flex items-center gap-1">
                  <Users className="w-3 h-3" /> member
                </NexusBadge>
              </div>

              <div ref={feedRef} className="flex-1 overflow-y-auto mu-scrollbar px-6 py-4 space-y-1 text-sm">
                {messagesLoading ? (
                  <div className="text-brand-green/40 text-xs">loading history...</div>
                ) : messages.length === 0 ? (
                  <div className="text-brand-green/40 text-xs">-- no messages yet, be the first --</div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="leading-relaxed"
                      >
                        <span className="text-brand-green/40">[{formatTime(m.createdAt)}]</span>{' '}
                        <span className={cn('font-bold', m.userId === user?.id ? 'text-brand-green' : 'text-cyan-400')}>
                          {m.username ?? m.userId.slice(0, 8)}&gt;
                        </span>{' '}
                        <span className="text-white/90">{m.content}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-brand-green/15 flex items-center gap-3 bg-[#050705]">
                <span className="text-brand-green/60 text-sm shrink-0">$</span>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`message #${activeDetail.name.toLowerCase()}...`}
                  maxLength={2000}
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-brand-green/30"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="p-2 rounded text-brand-green hover:bg-brand-green/10 disabled:opacity-30 transition-colors"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
