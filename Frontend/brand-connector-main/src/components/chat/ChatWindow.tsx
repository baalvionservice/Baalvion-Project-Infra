'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  CheckCheck,
  Clock,
  Loader2,
  X,
  Plus,
  Smile,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useStorage } from '@/firebase';
import { ChatMessage, Conversation } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Card } from '../ui';

interface ChatWindowProps {
  conversationId: string;
  otherParticipant: {
    id: string;
    name: string;
    avatar: string;
    status?: 'online' | 'offline';
  };
  className?: string;
}

export function ChatWindow({ conversationId, otherParticipant, className }: ChatWindowProps) {
  const { currentUser } = useAuth();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [msgLimit, setMsgLimit] = useState(50);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Real-time Message Listener
  useEffect(() => {
    if (!conversationId) return;

    const mQuery = query(
      collection(db!, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(msgLimit)
    );

    const unsubscribe = onSnapshot(mQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];

      // Sort ascending for UI
      setMessages(newMessages.reverse());

      // Mark as read logic
      if (currentUser?.id) {
        snapshot.docs.forEach(msgDoc => {
          const data = msgDoc.data() as ChatMessage;
          if (data.senderId !== currentUser.id && !data.readBy.includes(currentUser.id)) {
            updateDoc(doc(db!, 'conversations', conversationId, 'messages', msgDoc.id), {
              readBy: arrayUnion(currentUser.id)
            });
          }
        });
      }
    });

    return () => unsubscribe();
  }, [db!, conversationId, currentUser?.id, msgLimit]);

  // 2. Typing Indicator Listener
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = onSnapshot(doc(db!, 'conversations', conversationId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Conversation;
        const isPartnerTyping = data.typing?.[otherParticipant.id] || false;
        setOtherTyping(isPartnerTyping);
      }
    });

    return () => unsubscribe();
  }, [db!, conversationId, otherParticipant.id]);

  // Scroll to bottom helper
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, otherTyping]);

  const handleTyping = (text: string) => {
    setInputText(text);

    if (!isTyping && currentUser?.id) {
      setIsTyping(true);
      updateDoc(doc(db!, 'conversations', conversationId), {
        [`typing.${currentUser.id}`]: true
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (currentUser?.id) {
        setIsTyping(false);
        updateDoc(doc(db!, 'conversations', conversationId), {
          [`typing.${currentUser.id}`]: false
        });
      }
    }, 3000);
  };

  const sendMessage = async (text?: string, media?: { url: string, type: 'IMAGE' | 'DOCUMENT' }) => {
    if ((!text?.trim() && !media) || !currentUser || !conversationId) return;

    const msgData = {
      senderId: currentUser.id,
      text: text || '',
      mediaUrl: media?.url || null,
      mediaType: media?.type || null,
      readBy: [currentUser.id],
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db!, 'conversations', conversationId, 'messages'), msgData);
      await updateDoc(doc(db!, 'conversations', conversationId), {
        lastMessage: text || (media?.type === 'IMAGE' ? 'Sent an image' : 'Sent a document'),
        lastSenderId: currentUser.id,
        updatedAt: new Date().toISOString(),
        [`typing.${currentUser.id}`]: false
      });
      setInputText('');
      setIsTyping(false);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Message failed', description: 'Could not send message.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    const type = file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT';
    const id = Math.random().toString(36).substring(7);
    const storageRef = ref(storage!, `chats/${conversationId}/${id}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (err) => {
        toast({ variant: 'destructive', title: 'Upload failed' });
        setIsUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await sendMessage('', { url, type });
        setIsUploading(false);
        setUploadProgress(0);
      }
    );
  };

  const loadMore = () => {
    if (msgLimit >= 200) return;
    setLoadingHistory(true);
    setTimeout(() => {
      setMsgLimit(prev => prev + 50);
      setLoadingHistory(false);
    }, 1000);
  };

  return (
    <Card className={cn("flex flex-col h-full border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white", className)}>
      {/* Header */}
      <header className="h-20 border-b flex items-center justify-between px-8 shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm rounded-2xl">
              <AvatarImage src={otherParticipant.avatar} />
              <AvatarFallback className="font-black">{otherParticipant.name[0]}</AvatarFallback>
            </Avatar>
            {otherParticipant.status === 'online' && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
            )}
          </div>
          <div>
            <h3 className="font-black text-slate-900 leading-tight">{otherParticipant.name}</h3>
            <div className="flex items-center gap-1.5">
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                otherParticipant.status === 'online' ? "text-emerald-500" : "text-slate-400"
              )}>
                {otherParticipant.status === 'online' ? 'Active Now' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <ScrollArea className="flex-1 bg-slate-50/20 p-6 lg:p-8">
        <div className="space-y-6">
          {messages.length >= 50 && (
            <div className="flex justify-center mb-8">
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] font-black uppercase text-slate-400 hover:text-primary h-8 rounded-full"
                onClick={loadMore}
                disabled={loadingHistory || msgLimit >= 200}
              >
                {loadingHistory ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <ChevronDown className="h-3 w-3 mr-2" />}
                {msgLimit >= 200 ? 'End of local history' : 'Load previous messages'}
              </Button>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isMe = msg.senderId === currentUser?.id;
              const isRead = msg.readBy.length > 1;
              const showAvatar = i === 0 || messages[i - 1].senderId !== msg.senderId;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex items-end gap-3",
                    isMe ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {!isMe && (
                    <div className="w-8 shrink-0">
                      {showAvatar ? (
                        <Avatar className="h-8 w-8 rounded-lg border border-white shadow-sm">
                          <AvatarImage src={otherParticipant.avatar} />
                          <AvatarFallback>{otherParticipant.name[0]}</AvatarFallback>
                        </Avatar>
                      ) : <div className="w-8" />}
                    </div>
                  )}

                  <div className={cn(
                    "max-w-[75%] space-y-1 group",
                    isMe ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-5 py-3 rounded-3xl shadow-sm text-sm font-medium leading-relaxed transition-all",
                      isMe
                        ? "bg-slate-900 text-white rounded-br-none"
                        : "bg-white text-slate-700 border rounded-bl-none hover:bg-slate-50"
                    )}>
                      {msg.mediaUrl && (
                        <div className="mb-3 overflow-hidden rounded-xl bg-black/5">
                          {msg.mediaType === 'IMAGE' ? (
                            <img src={msg.mediaUrl} className="max-h-64 w-full object-cover" alt="Attachment" />
                          ) : (
                            <div className="p-4 flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <span className="text-xs font-bold truncate underline">View Document</span>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.text}
                    </div>

                    <div className={cn(
                      "flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity",
                      isMe ? "flex-row-reverse" : "flex-row"
                    )}>
                      <span className="text-[9px] font-black text-slate-400 uppercase">
                        {format(new Date(msg.createdAt), 'hh:mm a')}
                      </span>
                      {isMe && (
                        <CheckCheck className={cn(
                          "h-3 w-3 transition-colors",
                          isRead ? "text-primary" : "text-slate-300"
                        )} />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {otherTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={otherParticipant.avatar} />
                <AvatarFallback>{otherParticipant.name[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-white border rounded-3xl rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Section */}
      <footer className="p-6 lg:p-8 bg-white border-t shrink-0">
        {isUploading && (
          <div className="mb-4 space-y-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center text-[10px] font-black text-primary uppercase">
              <span>Encrypting Attachment...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1" />
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); sendMessage(inputText); }} className="relative flex items-center gap-4">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <input type="file" ref={fileInputRef} hidden onChange={handleFileUpload} />
          </div>

          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Type your message..."
              className="h-14 rounded-2xl bg-slate-50 border-none pl-6 pr-12 focus-visible:ring-primary text-md font-medium"
            />
            <button
              type="button"
              className="absolute right-4 top-4 text-slate-300 hover:text-primary transition-colors"
            >
              <Smile className="h-6 w-6" />
            </button>
          </div>

          <Button
            type="submit"
            disabled={!inputText.trim() || isUploading}
            className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 shrink-0 bg-primary hover:bg-primary/90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>

        <div className="mt-4 flex justify-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Lock className="h-3 w-3" /> End-to-End Encrypted Workspace
          </p>
        </div>
      </footer>
    </Card>
  );
}

function Lock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
