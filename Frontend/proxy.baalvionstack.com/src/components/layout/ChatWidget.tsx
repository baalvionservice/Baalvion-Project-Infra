import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  time: string;
}

const botResponses = [
  "Thanks for reaching out! A support agent will be with you shortly.",
  "I can help you with proxy configuration, billing, or account issues. What do you need?",
  "Our average response time is under 2 minutes. Hang tight!",
  "Have you checked our documentation at /docs? It might have the answer you need.",
  "I'm connecting you with a specialist now. Please hold.",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "m0", text: "Hi! 👋 How can we help you today?", sender: "bot", time: "Just now" },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, text: input, sender: "user", time: "Just now" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        sender: "bot",
        time: "Just now",
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 w-80 h-[420px] bg-card border border-border rounded-xl shadow-elevated flex flex-col z-[100] overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Support Chat</p>
                  <p className="text-xs text-muted-foreground">Typically replies in minutes</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  className="bg-secondary/50 text-sm"
                />
                <Button size="sm" onClick={send}><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-elevated z-[100] bg-primary hover:bg-primary/90"
        size="icon"
      >
        {open ? <X className="w-6 h-6 text-primary-foreground" /> : <MessageCircle className="w-6 h-6 text-primary-foreground" />}
      </Button>
    </>
  );
}
