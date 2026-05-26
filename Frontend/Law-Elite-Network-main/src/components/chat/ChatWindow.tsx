"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ShieldCheck, Lock, MessageSquare, Loader2 } from 'lucide-react';
import { subscribeToMessages, sendMessage, markAsRead } from '@/services/chat/chatService';
import { format } from 'date-fns';

interface ChatWindowProps {
  caseId: string;
  userId: string;
  receiverId: string;
}

/**
 * @fileOverview ChatWindow
 * High-fidelity executive messaging interface for specific legal matters.
 */
export default function ChatWindow({ caseId, userId, receiverId }: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToMessages(caseId, (data) => {
      setMessages(data);
      setLoading(false);
      
      // Mark unread messages as read
      data.forEach(m => {
        if (m.receiverId === userId && !m.isRead) {
          markAsRead(m.id);
        }
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [caseId, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const text = inputText;
    setInputText("");
    setSending(true);

    try {
      await sendMessage({
        caseId,
        senderId: userId,
        receiverId,
        text
      });
    } catch (error) {
      console.error("Message delivery failed", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[400px] glass-panel rounded-2xl border-slate-200 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent opacity-50" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Secure Uplink...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] glass-panel rounded-3xl border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in duration-500 bg-white">
      <header className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-headline text-lg italic text-slate-900 leading-none">Counsel Channel</h3>
            <div className="flex items-center gap-1.5 text-[8px] font-bold text-accent uppercase tracking-widest mt-1.5">
              <Lock className="w-2.5 h-2.5" /> End-to-End Secure
            </div>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
            <MessageSquare className="w-12 h-12 mb-4 text-slate-400" />
            <p className="text-xs italic font-medium text-slate-500">No intelligence broadcasted yet. Initialize secure communication.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => {
              const isMe = m.senderId === userId;
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className="max-w-[80%] space-y-1">
                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMe 
                        ? 'bg-accent text-white font-medium rounded-tr-none shadow-lg' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                    <p className={`text-[7px] font-bold uppercase tracking-tighter text-muted-foreground/40 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                      {m.createdAt ? format(new Date(m.createdAt), 'hh:mm a') : 'Syncing...'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <Input 
          placeholder="Type your secure message..." 
          className="border-slate-200 flex-1 h-11 text-xs bg-slate-50"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sending}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!inputText.trim() || sending}
          className="bg-[#0B1F3A] text-white hover:bg-slate-800 shadow-lg h-11 w-11 rounded-xl"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}
