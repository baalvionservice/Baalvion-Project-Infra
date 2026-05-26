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
  MessageSquare,
  Star,
  Zap,
  Filter,
  Briefcase,
  ChevronDown,
  X
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Mock Creator Data for Brand-side display mapping
const CREATOR_DATA: Record<string, any> = {
  'creator_1': { name: 'Sarah Chen', handle: '@sarah_tech', avatar: 'https://picsum.photos/seed/sarah/100/100', niche: 'Tech' },
  'creator_2': { name: 'Alex Rivers', handle: '@alex_creates', avatar: 'https://picsum.photos/seed/alex/100/100', niche: 'Lifestyle' },
  'creator_3': { name: 'Marcus Thorne', handle: '@m_fitness', avatar: 'https://picsum.photos/seed/marcus/100/100', niche: 'Fitness' },
};

// Campaign Templates for Quick Replies
const QUICK_REPLIES = [
  { label: 'Revision Request', text: "Hey! We reviewed the draft and would love to request a small revision on the lighting in the kitchen scene. Could you adjust that?" },
  { label: 'Brief Interest', text: "Hi! We've seen your application and love your pitch. Are you available to start next week?" },
  { label: 'Payment Note', text: "Just a heads up that we've funded the escrow for this milestone. You're clear to start work!" },
  { label: 'Asset Delivery', text: "Thanks for the assets! Our team will review them and get back to you within 24 hours." },
];

export default function BrandMessagesPage() {
  const { currentUser: authProfile } = useAuth();
  const db = useFirestore();
  
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations for this brand
  const convQuery = useMemo(() => {
    if (!authProfile?.id || !db) return null;
    return query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', authProfile.id),
      orderBy('updatedAt', 'desc')
    );
  }, [db, authProfile?.id]);

  const { data: conversations, loading: convLoading } = useCollection<any>(convQuery);

  // 2. Fetch Messages for selected conversation using specialized hook
  const { data: messages, loading: msgLoading } = useMessages(selectedConvId || undefined);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const creatorId = conv.participantIds.find((id: string) => id !== authProfile?.id);
      const creator = CREATOR_DATA[creatorId] || { name: 'New Creator' };
      return creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery, authProfile?.id]);

  const activeConversation = useMemo(() => 
    conversations.find(c => c.id === selectedConvId), 
    [conversations, selectedConvId]
  );

  const creatorId = activeConversation?.participantIds?.find((id: string) => id !== authProfile?.id);
  const activeCreator = creatorId ? (CREATOR_DATA[creatorId] || { name: 'Baalvion Creator', avatar: `https://picsum.photos/seed/${creatorId}/100/100`, handle: '@creator' }) : null;

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || messageText;
    if (!textToSend.trim() || !selectedConvId || !authProfile) return;

    setMessageText('');
    setIsSending(true);

    const messageData = {
      conversationId: selectedConvId,
      senderId: authProfile.id,
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    try {
      addDoc(collection(db!, 'conversations', selectedConvId, 'messages'), messageData);
      updateDoc(doc(db!, 'conversations', selectedConvId), {
        lastMessage: textToSend,
        lastSenderId: authProfile.id,
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

  const toggleStar = (id: string, current: boolean) => {
    updateDoc(doc(db!, 'conversations', id), {
      [`importantBy.${authProfile?.id}`]: !current
    }).catch(() => {});
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
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Brand Inbox</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search talent or chats..." 
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {convLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {filteredConversations.map((conv) => {
                const cId = conv.participantIds.find((id: string) => id !== authProfile?.id);
                const creator = CREATOR_DATA[cId] || { name: 'Baalvion Creator', avatar: `https://picsum.photos/seed/${cId}/100/100` };
                const isSelected = selectedConvId === conv.id;
                const unreadCount = conv.unreadCounts?.[authProfile?.id || ''] || 0;
                const isImportant = conv.importantBy?.[authProfile?.id || ''] === true;

                return (
                  <button
                    key={conv.id}
                    onClick={() => { setSelectedConvId(conv.id); setShowMobileList(false); }}
                    className={cn(
                      "w-full p-5 flex items-start gap-4 transition-all hover:bg-white text-left group",
                      isSelected ? "bg-white border-l-4 border-primary shadow-sm" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12 rounded-xl border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback>C</AvatarFallback>
                      </Avatar>
                      {isImportant && (
                        <div className="absolute -top-1 -right-1 bg-yellow-400 p-0.5 rounded-full border-2 border-white shadow-sm">
                          <Star className="h-2 w-2 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-slate-900 truncate">{creator.name}</h4>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px] h-4 font-black uppercase tracking-tighter px-1 border-slate-200 text-slate-400">
                          {conv.campaignTitle || 'Direct Chat'}
                        </Badge>
                        <p className={cn(
                          "text-[11px] truncate flex-1",
                          unreadCount > 0 ? "font-black text-slate-900" : "text-slate-500 font-medium"
                        )}>
                          {conv.lastMessage || 'No messages'}
                        </p>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <Badge className="bg-primary text-white text-[9px] font-black h-4 w-4 p-0 flex items-center justify-center rounded-full shrink-0">
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
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No conversations</p>
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
                    <AvatarImage src={activeCreator?.avatar} />
                    <AvatarFallback>C</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{activeCreator?.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      {activeCreator?.handle}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("rounded-full", activeConversation?.importantBy?.[authProfile?.id || ''] ? "text-yellow-500 fill-yellow-500" : "text-slate-300")}
                  onClick={() => toggleStar(selectedConvId, activeConversation?.importantBy?.[authProfile?.id || ''])}
                >
                  <Star className="h-5 w-5" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                    <DropdownMenuLabel>Collaboration Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="rounded-lg font-bold">
                      <Briefcase className="mr-2 h-4 w-4" /> View active campaign
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg font-bold">
                      <ImageIcon className="mr-2 h-4 w-4" /> View portfolio
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="rounded-lg font-bold text-red-600">
                      <AlertCircle className="mr-2 h-4 w-4" /> Report issues
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Message Area */}
            <ScrollArea className="flex-1 bg-slate-50/20 p-6">
              <div className="space-y-6">
                <div className="flex justify-center mb-8">
                  <Badge variant="outline" className="bg-white border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest px-4 py-1 h-7">
                    Secure Conversation Encrypted
                  </Badge>
                </div>

                {msgLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderId === authProfile?.id;
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
                          <Avatar className="h-8 w-8 rounded-lg shrink-0 border border-white shadow-sm">
                            <AvatarImage src={activeCreator?.avatar} />
                            <AvatarFallback>C</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          "max-w-[70%] space-y-1",
                          isMe ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "px-5 py-3 rounded-2xl text-sm font-medium shadow-sm",
                            isMe 
                              ? "bg-slate-900 text-white rounded-br-none" 
                              : "bg-white text-slate-700 border rounded-bl-none"
                          )}>
                            {msg.text}
                          </div>
                          <div className="flex items-center gap-1.5 px-1">
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

            {/* Input Bar & Quick Replies */}
            <footer className="p-6 bg-white border-t shrink-0">
              {/* Quick Replies Bar */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/10 mr-2 shrink-0">
                  <Zap className="h-3 w-3 fill-current" />
                  <span className="text-[9px] font-black uppercase">Templates</span>
                </div>
                {QUICK_REPLIES.map((reply) => (
                  <Button
                    key={reply.label}
                    variant="outline"
                    size="sm"
                    className="rounded-full h-7 px-4 text-[10px] font-bold border-slate-100 hover:border-primary hover:bg-primary/5 transition-all shrink-0"
                    onClick={() => handleSendMessage(undefined, reply.text)}
                  >
                    {reply.label}
                  </Button>
                ))}
              </div>

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
                    placeholder="Type a message or use a template..." 
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
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
            <div className="h-24 w-24 rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8">
              <MessageSquare className="h-12 w-12 text-primary/20" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Creator Collaboration Hub</h3>
            <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
              Communicate with talent who have applied to your campaigns or those you've invited directly.
            </p>
            <div className="mt-10 p-6 rounded-3xl bg-primary/5 border border-primary/10 max-w-lg w-full flex items-start gap-4 text-left">
              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="h-5 w-5 text-primary fill-primary" />
              </div>
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Market Standard</p>
                <p className="text-xs text-slate-600 font-medium">Quick responses increase creator acceptance rates by up to 40%. Use templates to save time.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
