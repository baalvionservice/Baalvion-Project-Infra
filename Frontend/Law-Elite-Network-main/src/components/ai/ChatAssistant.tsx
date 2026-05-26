
"use client";

import React, { useState, useRef, useEffect } from "react";
import { askAssistant } from "@/services/assistantService";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  Sparkles, 
  ChevronDown, 
  User,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * @fileOverview Scale-Ready ChatAssistant.
 * Performance optimized with memory-efficient state and production styling.
 */
export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { role: "bot", text: "Greetings. I am your Network Intelligence Assistant. How may I guide your professional discovery today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>(["Corporate Law", "Family Law", "Consultation Fees"]);

  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg = { role: "user", text: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    if (!textOverride) setInput("");
    
    setIsTyping(true);
    
    try {
      const aiRes = await askAssistant(textToSend);
      
      const botMsg = {
        role: "bot",
        text: aiRes.reply,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
      if (aiRes.quickQuestions) setQuickQuestions(aiRes.quickQuestions);

      if (aiRes.suggestion) {
        setTimeout(() => {
          router.push(`/search?q=${encodeURIComponent(aiRes.suggestion!)}`);
        }, 2000);
      }
    } catch (err) {
      console.error("AI Guidance interrupted:", err);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isMounted) return null;

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-accent text-accent-foreground shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border border-accent/20"
      >
        <MessageSquare className="w-6 h-6 group-hover:hidden" />
        <Sparkles className="w-6 h-6 hidden group-hover:block animate-pulse" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-background animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[360px] max-w-[90vw] h-[540px] glass-panel rounded-3xl border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
      <header className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-inner">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-headline text-lg italic text-white leading-none">Network Intel</h3>
            <p className="text-[9px] font-bold text-accent uppercase tracking-widest mt-1.5 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Guided Experience
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-2 text-muted-foreground hover:text-white transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </header>

      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-transparent to-black/5">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex gap-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <Avatar className="w-6 h-6 border border-white/10">
                  <AvatarFallback className={m.role === "user" ? "bg-white/5" : "bg-accent/10 text-accent"}>
                    {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-accent text-accent-foreground font-medium rounded-tr-none"
                      : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-accent" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-3 bg-white/[0.02] border-t border-white/5">
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-accent hover:border-accent/30 transition-all duration-300"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-white/5 border-t border-white/5">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Inquire with the network..."
            className="glass-panel border-white/10 h-11 text-xs pl-4 rounded-xl focus:border-accent/50"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || isTyping}
            className="h-11 w-11 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 shadow-lg shadow-accent/20 transition-all active:scale-90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-[8px] text-muted-foreground/40 text-center mt-3 uppercase tracking-tighter italic">
          Guidance is provided by the Law Elite Intelligence protocol v2.4
        </p>
      </div>
    </div>
  );
}
