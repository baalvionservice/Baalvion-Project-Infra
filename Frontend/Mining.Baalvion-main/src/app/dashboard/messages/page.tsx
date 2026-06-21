"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Paperclip, 
  Send, 
  MoreVertical, 
  CheckCheck,
  Building2,
  FileText,
  Image as ImageIcon,
  Archive,
  Circle,
  ExternalLink,
  Phone,
  Video,
  ChevronLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function MessagingPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  const conversations = [
    { 
      id: "C-101", 
      partner: "China Const Ltd", 
      role: "Buyer", 
      snippet: "What is the expected lead time for the next batch of 62% Fe Iron Ore?", 
      time: "10:45 AM", 
      unread: 2, 
      status: "online",
      context: "Order ORD-9921" 
    },
    { 
      id: "C-102", 
      partner: "Global Freight Ltd", 
      role: "Logistics", 
      snippet: "The vessel M.V. Ocean Carrier has cleared the Port of Durban.", 
      time: "Yesterday", 
      unread: 0, 
      status: "offline",
      context: "Shipment SHP-105" 
    },
    { 
      id: "C-103", 
      partner: "Atlas Mining Co", 
      role: "Seller", 
      snippet: "The updated purity report is attached for your review.", 
      time: "Tue", 
      unread: 0, 
      status: "online",
      context: "RFQ RFQ-2024-001" 
    },
  ];

  const messages = [
    { id: 1, sender: "me", content: "Hello, following up on the shipment documentation for the Durban port entry.", time: "09:30 AM", status: "read" },
    { id: 2, sender: "them", content: "Hi! We've just uploaded the Bill of Lading to the document center. You should see it in your dashboard.", time: "09:35 AM", status: "read" },
    { 
      id: 3, 
      sender: "them", 
      content: "I've also attached a copy here for quick reference.", 
      time: "09:36 AM", 
      status: "read",
      attachment: { name: "BL_DURBAN_772.pdf", size: "1.2 MB", type: "pdf" }
    },
    { id: 4, sender: "me", content: "Received, thank you. We'll proceed with the customs clearance now.", time: "10:15 AM", status: "delivered" },
    { id: 5, sender: "them", content: "What is the expected lead time for the next batch of 62% Fe Iron Ore?", time: "10:45 AM", status: "sent" },
  ];

  return (
    <div className="flex h-[calc(100vh-160px)] -m-8 overflow-hidden bg-white border-t">
      {/* Sidebar - Conversation List */}
      <aside className={cn(
        "w-full md:w-80 border-r flex flex-col bg-slate-50/50 transition-all",
        selectedConversation ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Messages</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" aria-label="Archive all conversations">
              <Archive className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <Input placeholder="Search conversations..." className="pl-9 h-10 bg-white border-slate-200" aria-label="Search conversation list" />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
            {["All", "Orders", "RFQs", "Support"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t.toLowerCase())}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-full transition-colors whitespace-nowrap",
                  activeTab === t.toLowerCase() ? "bg-primary text-white" : "bg-white border text-slate-500 hover:bg-slate-100"
                )}
                aria-pressed={activeTab === t.toLowerCase()}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="divide-y border-t" role="list" aria-label="Conversations">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedConversation(c)}
                className={cn(
                  "w-full p-4 flex gap-3 text-left transition-colors hover:bg-white group",
                  selectedConversation?.id === c.id ? "bg-white" : "bg-transparent"
                )}
                role="listitem"
                aria-selected={selectedConversation?.id === c.id}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12 border border-slate-100">
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">{c.partner[0]}</AvatarFallback>
                  </Avatar>
                  {c.status === "online" && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white" aria-label="User is online" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{c.partner}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{c.time}</span>
                  </div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{c.role} • {c.context}</p>
                  <p className={cn(
                    "text-xs truncate",
                    c.unread > 0 ? "text-slate-900 font-semibold" : "text-slate-500"
                  )}>
                    {c.snippet}
                  </p>
                </div>
                {c.unread > 0 && (
                  <Badge className="bg-secondary text-secondary-foreground h-5 w-5 flex items-center justify-center p-0 rounded-full text-[10px] mt-1 shrink-0" aria-label={`${c.unread} unread messages`}>
                    {c.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Chat Area */}
      <main className={cn(
        "flex-1 flex flex-col bg-white relative transition-all",
        !selectedConversation ? "hidden md:flex" : "flex"
      )} role="main" aria-label="Chat Message Interface">
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <Send className="h-10 w-10" aria-hidden="true" />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-bold text-slate-900">Your Secure Trade Inbox</h3>
              <p className="text-sm text-slate-500">Select a conversation to start negotiating, share files, or coordinate shipments.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="h-16 border-b px-4 md:px-6 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur z-10 sticky top-0">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden h-8 w-8 text-slate-500" 
                  onClick={() => setSelectedConversation(null)}
                  aria-label="Back to conversation list"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">{selectedConversation.partner[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedConversation.partner}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Circle className="h-1.5 w-1.5 fill-current" aria-hidden="true" /> Online
                    </span>
                    <span className="text-slate-300" aria-hidden="true">•</span>
                    <span className="text-[10px] text-slate-400 font-medium">Verified {selectedConversation.role}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500" aria-label="Start Voice Call"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500" aria-label="Start Video Call"><Video className="h-4 w-4" /></Button>
                <div className="h-6 w-px bg-slate-200 mx-1" aria-hidden="true" />
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500" aria-label="View Full Profile"><ExternalLink className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500" aria-label="More Options"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </header>

            {/* Context Info Bar */}
            <div className="bg-slate-50 border-b px-6 py-2 flex flex-wrap items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 gap-2">
              <div className="flex flex-wrap gap-4">
                <span>Subject: {selectedConversation.context}</span>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">|</span>
                <span>Type: {selectedConversation.role} Discussion</span>
              </div>
              <button className="text-primary hover:underline flex items-center gap-1">
                View Related Order <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <ScrollArea className="flex-1 p-4 md:p-6" aria-live="polite">
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex justify-center">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">Today</span>
                </div>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex flex-col max-w-[85%] md:max-w-[70%]",
                      m.sender === "me" ? "ml-auto items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-2xl text-sm shadow-sm",
                      m.sender === "me" 
                        ? "bg-primary text-white rounded-tr-none" 
                        : "bg-slate-100 text-slate-900 rounded-tl-none border"
                    )}>
                      {m.content}
                      {m.attachment && (
                        <button 
                          className={cn(
                            "mt-3 p-3 w-full rounded-lg border flex items-center gap-3 transition-colors text-left",
                            m.sender === "me" ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-white border-slate-200 hover:bg-slate-50"
                          )}
                          aria-label={`Download attachment ${m.attachment.name}`}
                        >
                          <div className={cn(
                            "h-10 w-10 rounded flex items-center justify-center shrink-0",
                            m.sender === "me" ? "bg-white/20 text-white" : "bg-primary/5 text-primary"
                          )}>
                            <FileText className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate">{m.attachment.name}</p>
                            <p className={cn("text-[9px] opacity-70 font-medium", m.sender === "me" ? "text-white" : "text-slate-500")}>
                              {m.attachment.size} • {m.attachment.type.toUpperCase()}
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 px-1">
                      <span className="text-[9px] font-medium text-slate-400">{m.time}</span>
                      {m.sender === "me" && (
                        <CheckCheck className={cn(
                          "h-3 w-3",
                          m.status === "read" ? "text-secondary" : "text-slate-300"
                        )} aria-label={`Message ${m.status}`} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <footer className="p-4 border-t bg-white shrink-0">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-end gap-2 md:gap-3 bg-slate-50 border rounded-2xl p-2 px-3 focus-within:border-primary/50 transition-colors">
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-primary rounded-xl" aria-label="Attach file">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-primary rounded-xl hidden sm:flex" aria-label="Add image">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <textarea 
                    placeholder="Type message..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 min-h-[44px] max-h-32 resize-none leading-relaxed"
                    rows={1}
                    aria-label="New message content"
                  />
                  <Button className="h-10 w-10 bg-primary text-white rounded-xl shrink-0" aria-label="Send message">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 px-2">
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest hidden sm:block">Press Enter to send</p>
                  <div className="h-1 w-1 bg-slate-300 rounded-full hidden sm:block" />
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest flex items-center gap-1">
                    <Building2 className="h-2.5 w-2.5" aria-hidden="true" /> End-to-end encrypted
                  </p>
                </div>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}