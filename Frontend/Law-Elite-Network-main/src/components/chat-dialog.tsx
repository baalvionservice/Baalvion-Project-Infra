
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthContext } from '@/context/AuthContext';
import { useCollection, useFirestore } from '@/firebase';
import { ChatRepository } from '@/lib/api/repositories/chat.repository';
import { MessageSquare, Send, Loader2, ShieldCheck } from 'lucide-react';

interface ChatDialogProps {
  lawyerUid: string;
  lawyerName: string;
}

export function ChatDialog({ lawyerUid, lawyerName }: ChatDialogProps) {
  const { user, role, chatController } = useAuthContext();
  const [conversation, setConversation] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const db = useFirestore();

  const handleStartChat = async () => {
    if (!user || !chatController) return;
    setIsConnecting(true);
    const res = await chatController.startConversation({
      clientUid: user.uid,
      lawyerUid: lawyerUid,
      role: role
    });
    if (res.success) {
      setConversation(res.data);
    }
    setIsConnecting(false);
  };

  // Real-time messages listener
  const messagesQuery = conversation ? new ChatRepository(db).getMessagesQuery(conversation.conversationId) : null;
  const { data: messages, loading: messagesLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation || !chatController || !user) return;

    const text = inputText;
    setInputText('');
    
    await chatController.sendMessage({
      conversationId: conversation.conversationId,
      senderUid: user.uid,
      text: text
    });
  };

  return (
    <Dialog onOpenChange={(open) => { if(open) handleStartChat(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-accent/20 text-accent hover:bg-accent/5">
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Secure Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-white/10 text-white max-w-md h-[600px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="font-headline text-xl italic">Counsel: {lawyerName}</DialogTitle>
              <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-0.5">End-to-End Encrypted Channel</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative">
          {isConnecting ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
              <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest">Establishing Secure Uplink...</p>
            </div>
          ) : (
            <ScrollArea className="h-full p-6">
              <div className="space-y-4">
                {messages?.map((msg, i) => (
                  <div key={msg.messageId || i} className={`flex ${msg.senderUid === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.senderUid === user?.uid 
                        ? 'bg-accent text-accent-foreground font-medium rounded-tr-none' 
                        : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        <form onSubmit={handleSend} className="p-6 bg-white/5 border-t border-white/5 flex gap-2">
          <Input 
            placeholder="Type your message..." 
            className="glass-panel border-white/10 flex-1"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <Button type="submit" size="icon" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
