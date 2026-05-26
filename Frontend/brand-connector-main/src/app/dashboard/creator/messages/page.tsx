'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  CheckCheck,
  Image as ImageIcon,
  Smile,
  Clock,
  ChevronLeft,
  Loader2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection } from '@/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { useMessages } from '@/hooks/use-realtime-data';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Mock Brand Data for display mapping
const BRAND_DATA: Record<string, any> = {
  'brand_1': { name: 'Lumina Tech', logo: 'https://picsum.photos/seed/lumina/100/100', industry: 'Consumer AI' },
  'brand_2': { name: 'EcoVibe', logo: 'https://picsum.photos/seed/eco/100/100', industry: 'Fashion' },
  'brand_3': { name: 'FitFlow', logo: 'https://picsum.photos/seed/fit/100/100', industry: 'Health' },
};

export default function CreatorMessagesPage() {
  const { currentUser } = useAuth();
  const db = useFirestore();

  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations
  const convQuery = useMemo(() => {
    if (!currentUser?.id || !db) return null;
    return query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', currentUser.id),
      orderBy('updatedAt', 'desc')
    );
  }, [db, currentUser?.id]);

  const { data: conversations, loading: convLoading } = useCollection<any>(convQuery);

  // 2. Fetch Messages for selected conversation using specialized hook
  const { data: messages, loading: msgLoading } = useMessages(selectedConvId || undefined);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const activeConversation = useMemo(() =>
    conversations.find(c => c.id === selectedConvId),
    [conversations, selectedConvId]
  );

  const brandId = activeConversation?.participantIds?.find((id: string) => id !== currentUser?.id);
  const activeBrand = brandId ? (BRAND_DATA[brandId] || { name: 'Baalvion Brand', logo: `https://picsum.photos/seed/${brandId}/100/100` }) : null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConvId || !currentUser) return;

    const text = messageText;
    setMessageText('');
    setIsSending(true);

    const messageData = {
      conversationId: selectedConvId,
      senderId: currentUser.id,
      text: text,
      createdAt: new Date().toISOString()
    };

    try {
      // Add message to subcollection
      await addDoc(collection(db!, 'conversations', selectedConvId, 'messages'), messageData);

      // Update conversation metadata
      await updateDoc(doc(db!, 'conversations', selectedConvId), {
        lastMessage: text,
        lastSenderId: currentUser.id,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: `/conversations/${selectedConvId}/messages`,
        operation: 'create',
        requestResourceData: messageData
      }));
    } finally {
      setIsSending(false);
    }
  };

  const selectConversation = (id: string) => {
    setSelectedConvId(id);
    setShowMobileList(false);

    // In a real app, you'd mark as read here
    updateDoc(doc(db!, 'conversations', id), {
      [`unreadCounts.${currentUser?.id}`]: 0
    }).catch(() => { });
  };

  return (
    <div className="h-[calc(100vh-160px)] flex bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border">

      {/* LEFT PANEL: Conversation List */}
      <aside className={cn(
        "w-full md:w-80 lg:w-96 border-r flex flex-col bg-slate-50/30",
        !showMobileList && "hidden md:flex"
      )}>
        <div className="p-6 border-b bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Messages</h2>
            <Badge className="bg-primary/10 text-primary border-none font-black text-[10px]">
              {conversations.length} CHATS
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search brands..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {convLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : conversations.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {conversations.map((conv) => {
                const bId = conv.participantIds.find((id: string) => id !== currentUser?.id);
                const bInfo = BRAND_DATA[bId] || { name: 'Baalvion Brand', logo: `https://picsum.photos/seed/${bId}/100/100` };
                const isSelected = selectedConvId === conv.id;
                const unreadCount = conv.unreadCounts?.[currentUser?.id || ''] || 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={cn(
                      "w-full p-5 flex items-start gap-4 transition-all hover:bg-white text-left",
                      isSelected ? "bg-white border-l-4 border-primary shadow-sm" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12 rounded-xl border-2 border-white shadow-sm">
                        <AvatarImage src={bInfo.logo} />
                        <AvatarFallback>B</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-slate-900 truncate">{bInfo.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs truncate",
                        unreadCount > 0 ? "font-black text-slate-900" : "text-slate-500 font-medium"
                      )}>
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <Badge className="bg-primary text-white text-[10px] font-black h-5 w-5 p-0 flex items-center justify-center rounded-full shrink-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                <MessageSquare className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No conversations found</p>
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* RIGHT PANEL: Chat Thread */}
      <main className={cn(
        "flex-1 flex flex-col bg-white",
        showMobileList && "hidden md:flex"
      )}>
        {selectedConvId ? (
          <>
            {/* Thread Header */}
            <header className="h-20 border-b flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden rounded-full"
                  onClick={() => setShowMobileList(true)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-xl">
                    <AvatarImage src={activeBrand?.logo} />
                    <AvatarFallback>B</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{activeBrand?.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-tighter">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Now
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary">
                  <Video className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {/* Message Area */}
            <ScrollArea className="flex-1 bg-slate-50/20 p-6">
              <div className="space-y-6">
                <div className="flex justify-center mb-8">
                  <Badge variant="outline" className="bg-white border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest px-4 py-1 h-7">
                    Collaboration Started
                  </Badge>
                </div>

                {msgLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderId === currentUser?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex items-end gap-3",
                          isMe ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        {!isMe && (
                          <Avatar className="h-8 w-8 rounded-lg shrink-0">
                            <AvatarImage src={activeBrand?.logo} />
                            <AvatarFallback>B</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          "max-w-[70%] space-y-1",
                          isMe ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "px-5 py-3 rounded-2xl text-sm font-medium shadow-sm",
                            isMe
                              ? "bg-primary text-white rounded-br-none"
                              : "bg-white text-slate-700 border rounded-bl-none"
                          )}>
                            {msg.text}
                          </div>
                          <div className={cn(
                            "flex items-center gap-1.5 px-1",
                            isMe ? "justify-end" : "justify-start"
                          )}>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <CheckCheck className="h-3 w-3 text-primary" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Bar */}
            <footer className="p-6 bg-white border-t shrink-0">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-xl bg-slate-50 text-slate-400 hover:text-primary transition-colors"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your proposal or message..."
                    className="h-14 rounded-2xl bg-slate-50 border-none pl-6 pr-12 focus-visible:ring-primary text-md"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-4 text-slate-300 hover:text-primary transition-colors"
                  >
                    <Smile className="h-6 w-6" />
                  </button>
                </div>

                <Button
                  disabled={!messageText.trim() || isSending}
                  className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 shrink-0"
                >
                  {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>
              <div className="mt-3 flex justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Average response time: <span className="text-primary">2 hours</span>
                </p>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
            <div className="h-24 w-24 rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8">
              <MessageSquare className="h-12 w-12 text-primary/20" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Secure Collaboration Hub</h3>
            <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
              Select a conversation from the sidebar to chat with brands, share content drafts, and finalize campaign details.
            </p>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-3 text-left">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-[10px] font-bold text-slate-600 uppercase">Payments are held in escrow for your safety.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-3 text-left">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-[10px] font-bold text-slate-600 uppercase">Brands usually respond within 4-6 business hours.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
