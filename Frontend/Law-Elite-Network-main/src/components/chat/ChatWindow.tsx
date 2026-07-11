"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ShieldCheck, Lock, MessageSquare, Loader2, Paperclip, FileText, Video, Phone } from 'lucide-react';
import { subscribeToMessages, sendMessage, markAsRead, uploadChatFile, getChatFileUrl, startChatCall } from '@/services/chat/chatService';
import { realtime } from '@/lib/realtime';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  const [uploading, setUploading] = useState(false);
  const [callBusy, setCallBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  // Real-time delivery: append messages for this thread the instant they arrive
  // (no waiting for the next poll). De-duped by id against current state.
  useEffect(() => {
    const off = realtime().on('message', (payload: any) => {
      const m = payload?.message;
      if (!m) return;
      if (caseId && String(m.case_id) !== String(caseId)) return; // other thread
      setMessages((prev) => {
        if (prev.some((x) => String(x.id) === String(m.id))) return prev;
        return [...prev, {
          id: m.id,
          senderId: m.sender_id,
          receiverId: m.receiver_id,
          text: m.content,
          type: m.type,
          fileUrl: m.file_url,
          createdAt: m.created_at || new Date().toISOString(),
          isRead: false,
        }];
      });
      if (String(m.receiver_id) === String(userId)) markAsRead(m.id);
    });
    return () => { off(); };
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

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await uploadChatFile(file, { caseId, receiverId });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed", description: "Could not send attachment. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleStartCall = async (audioOnly: boolean) => {
    if (callBusy) return;
    setCallBusy(true);
    try {
      const { room } = await startChatCall({ caseId, receiverId, audioOnly });
      if (room?.roomUrl) window.open(room.roomUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({ variant: "destructive", title: "Call failed to start", description: "Please try again." });
    } finally {
      setCallBusy(false);
    }
  };

  const handleOpenAttachment = async (messageId: string) => {
    try {
      const url = await getChatFileUrl(messageId);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast({ variant: "destructive", title: "Could not open attachment" });
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
        <div className="flex items-center gap-1.5">
          <Button
            type="button" size="icon" variant="ghost" disabled={callBusy}
            className="h-9 w-9 text-slate-500 hover:text-accent hover:bg-accent/10"
            onClick={() => handleStartCall(true)}
            title="Start voice call"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            type="button" size="icon" variant="ghost" disabled={callBusy}
            className="h-9 w-9 text-slate-500 hover:text-accent hover:bg-accent/10"
            onClick={() => handleStartCall(false)}
            title="Start video call"
          >
            <Video className="w-4 h-4" />
          </Button>
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
                      {m.type === 'file' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAttachment(m.id)}
                          className={`flex items-center gap-2 underline decoration-dotted underline-offset-2 ${isMe ? 'text-white' : 'text-slate-700'}`}
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" /> {m.text}
                        </button>
                      ) : m.type === 'call' ? (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 font-bold ${isMe ? 'text-white' : 'text-slate-700'}`}
                        >
                          <Video className="w-3.5 h-3.5 shrink-0" /> {m.text} — Join
                        </a>
                      ) : (
                        m.text
                      )}
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
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="application/pdf,image/*,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={handleFileSelected}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="border-slate-200 h-11 w-11 rounded-xl text-slate-500 hover:text-accent"
          title="Attach a file"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </Button>
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
