"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Chat } from '@/types/chat';
import { MessageSquare, ShieldCheck, ChevronRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  chats: Chat[];
  userId: string;
  onSelect: (id: string) => void;
}

/**
 * @fileOverview ChatList
 * Premium overview of active secure communication channels.
 */
export default function ChatList({ chats, userId, onSelect }: ChatListProps) {
  return (
    <div className="space-y-3 animate-in fade-in duration-700">
      {chats.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-2xl border-dashed border-slate-200">
          <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm italic text-muted-foreground">No active communication channels established.</p>
        </div>
      ) : (
        chats.map((chat) => {
          const otherParticipantId = chat.participants.find(p => p !== userId);
          const otherParticipantName = chat.participantNames?.[otherParticipantId || ""] || "Elite Member";

          return (
            <Card 
              key={chat.id}
              onClick={() => onSelect(chat.id)}
              className="glass-panel border-slate-200 executive-card cursor-pointer group hover:border-accent/30 overflow-hidden"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-headline text-lg italic text-slate-900 truncate">
                          {otherParticipantName}
                        </h4>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate italic">
                        {chat.lastMessage || "Establish connection..."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 justify-end">
                      <Clock className="w-3 h-3" /> {formatDistanceToNow(chat.updatedAt)} ago
                    </p>
                    <div className="mt-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Open Channel</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
