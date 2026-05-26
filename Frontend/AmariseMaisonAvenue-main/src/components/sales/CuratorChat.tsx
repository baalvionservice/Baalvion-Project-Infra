
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSalesSystem } from '@/hooks/use-sales-system';
import { Send, Lock, ShieldCheck, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface CuratorChatProps {
  inquiryId: string;
}

export function CuratorChat({ inquiryId }: CuratorChatProps) {
  const { getInquiry, getConversation, sendClientMessage } = useSalesSystem();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const inquiry = getInquiry(inquiryId);
  const conversation = getConversation(inquiryId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  if (!inquiry || !conversation) return null;

  const handleSend = () => {
    if (!message.trim()) return;
    sendClientMessage(inquiryId, message);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-[700px] bg-white border border-border shadow-luxury overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-border bg-ivory/50 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-plum rounded-full flex items-center justify-center font-headline text-xl font-bold italic text-white shadow-md">
            M
          </div>
          <div>
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-gray-900">Maison Curator</h3>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Secure Dialogue Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-secondary">
          <Crown className="w-4 h-4" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Tier {inquiry.leadTier} Priority</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-ivory/5"
      >
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <ShieldCheck className="w-8 h-8 text-secondary/30" />
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em] max-w-[250px]">
            End-to-end encrypted curatorial dialogue
          </p>
        </div>

        {conversation.messages.map((m) => (
          <div key={m.id} className={cn("flex", m.sender === 'client' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] p-6 shadow-sm border animate-fade-in",
              m.sender === 'client' 
                ? "bg-white border-border text-gray-700" 
                : "bg-plum text-white border-plum italic font-light"
            )}>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>
              <p className={cn(
                "text-[7px] mt-3 font-bold uppercase tracking-widest",
                m.sender === 'client' ? "text-gray-300" : "text-white/40"
              )}>
                {m.sender === 'client' ? inquiry.customerName : 'Maison Curatorial Desk'} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {inquiry.status === 'closing' && (
          <div className="p-8 bg-gold/5 border border-gold/20 text-center space-y-6 animate-fade-in">
            <Sparkles className="w-6 h-6 text-gold mx-auto" />
            <div className="space-y-2">
              <h4 className="text-lg font-headline font-bold italic">Acquisition Readiness</h4>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Your curator has approved this artifact for private reservation.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="h-12 px-8 rounded-none bg-black text-white hover:bg-plum text-[10px] font-bold tracking-widest uppercase">
                RESERVE THIS PIECE
              </Button>
              <Button variant="outline" className="h-12 px-8 rounded-none border-black text-[10px] font-bold tracking-widest uppercase hover:bg-black hover:text-white">
                REQUEST INVOICE
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-8 border-t border-border bg-white">
        <div className="relative group">
          <Textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Discreetly type your message..."
            className="min-h-[80px] rounded-none border-border focus:ring-plum text-xs italic font-light bg-ivory/20 px-6 py-4"
          />
          <div className="absolute bottom-4 right-4">
            <Button 
              size="sm"
              className="bg-plum text-white hover:bg-black h-10 px-6 rounded-none text-[9px] font-bold uppercase tracking-widest transition-all shadow-md" 
              onClick={handleSend}
            >
              TRANSMIT <Send className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center space-x-2 opacity-20">
          <Lock className="w-3 h-3" />
          <span className="text-[8px] font-bold uppercase tracking-widest">Maison Encrypted</span>
        </div>
      </div>
    </div>
  );
}
