
"use client"

import { ChatMessage, Conversation, MOCK_MESSAGES } from "@/lib/mock-messages-data";
import { MessageBubble } from "./message-bubble";
import { cn } from "@/lib/utils";
import { 
  Video, 
  Phone, 
  Search, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Mic, 
  Send, 
  ChevronDown,
  X,
  CreditCard,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface ChatWindowProps {
  conversation: Conversation;
}

export const ChatWindow = ({ conversation }: ChatWindowProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES[conversation.id] || []);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(MOCK_MESSAGES[conversation.id] || []);
  }, [conversation.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      senderName: 'Aryan Mehta',
      senderAvatar: '',
      senderRole: 'student',
      text: input,
      timestamp: 'Now',
      status: 'sending',
      type: 'text'
    };

    setMessages(prev => [...prev, newMsg]);
    setInput("");

    // Simulate status transitions
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'sent' } : m));
    }, 800);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m));
    }, 1600);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'read' } : m));
    }, 2400);

    // Mock reply typing
    setTimeout(() => setIsTyping(true), 3000);
    setTimeout(() => setIsTyping(false), 5000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0F] h-full overflow-hidden relative">
      {/* Header */}
      <header className="h-16 shrink-0 bg-[#0D0D14]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-gray-800 flex items-center justify-center text-lg">
              {conversation.avatar.length > 2 ? <Image src={conversation.avatar} alt="" fill sizes="40px" className="object-cover" /> : conversation.avatar}
            </div>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0D0D14]",
              conversation.status === 'online' ? "bg-[#00E676]" : "bg-gray-600"
            )} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none mb-1">{conversation.name}</h3>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              {conversation.status === 'online' ? "Active Now" : "Offline"} • {conversation.role}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation.role === 'teacher' && (
            <button className="p-2.5 hover:bg-blue-500/10 rounded-xl text-blue-400 transition-all group" title="Start Class">
              <Video className="w-5 h-5 group-hover:scale-110" />
            </button>
          )}
          <button className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-1 relative"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-white/5">
            Conversation started March 8, 2026
          </div>
        </div>

        {messages.map((msg, i) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isSequential={i > 0 && messages[i-1].senderId === msg.senderId} 
          />
        ))}

        <AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 mt-4 ml-1"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                <Image src={conversation.avatar} alt="" fill sizes="32px" className="object-cover" />
              </div>
              <div className="bg-[#1C1C28] px-4 py-2 rounded-2xl flex gap-1 items-center">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-gray-400 rounded-full" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-gray-400 rounded-full" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-gray-400 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 bg-[#0D0D14] border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-[#6C63FF]/50 transition-all">
            <button className="p-2.5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={`Message ${conversation.name.split(' ')[0]}...`}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white py-2.5 resize-none no-scrollbar min-h-[44px]"
            />
            <div className="flex items-center gap-1 shrink-0 pb-1">
              <button className="p-2.5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all">
                <Smile className="w-5 h-5" />
              </button>
              <button className="p-2.5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all">
                <Mic className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  input.trim() ? "bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/20" : "text-gray-700 bg-white/5 cursor-not-allowed"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
