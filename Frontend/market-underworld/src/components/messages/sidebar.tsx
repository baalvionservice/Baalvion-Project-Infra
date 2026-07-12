
"use client"

import { Conversation, CONVERSATIONS } from "@/lib/mock-messages-data";
import { cn } from "@/lib/utils";
import { Search, Edit, Pin, MoreVertical, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export const MessagesSidebar = ({ activeId, onSelect }: SidebarProps) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const filtered = CONVERSATIONS.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    (activeTab === "All" || (activeTab === "Unread" && c.unreadCount > 0) || (activeTab === "Teachers" && c.role === 'teacher'))
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#0D0D14] border-r border-white/5">
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            <span className="bg-[#FF3D57] text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              5 unread
            </span>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
            <Edit className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 h-10 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#6C63FF]/50 outline-none transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 border-b border-white/5">
          {["All", "Unread", "Teachers", "Sellers", "Groups"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                activeTab === tab ? "bg-[#6C63FF]/20 text-white border border-[#6C63FF]/30" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-2 space-y-1">
          {filtered.map((conv, idx) => (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group",
                activeId === conv.id ? "bg-[#1A1A2E] border border-white/5" : "hover:bg-white/[0.03]"
              )}
            >
              {activeId === conv.id && (
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-[#6C63FF] to-[#00D4FF] rounded-r-full" />
              )}

              <div className="relative shrink-0">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-gray-800 flex items-center justify-center text-xl">
                  {conv.avatar.length > 2 ? <Image src={conv.avatar} alt="" fill sizes="48px" className="object-cover" /> : conv.avatar}
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0D0D14]",
                  conv.status === 'online' ? "bg-[#00E676]" : conv.status === 'away' ? "bg-amber-500" : "bg-gray-600"
                )} />
                {conv.isPinned && <Pin className="absolute -top-1 -left-1 w-3 h-3 text-[#6C63FF] fill-[#6C63FF]" />}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className={cn("text-sm font-bold truncate", conv.unreadCount > 0 ? "text-white" : "text-gray-300")}>
                    {conv.name}
                  </h4>
                  <span className="text-[9px] text-gray-600 font-bold uppercase shrink-0">{conv.lastMessageTime}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className={cn("text-xs truncate", conv.unreadCount > 0 ? "text-gray-300 font-semibold" : "text-gray-500")}>
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="bg-[#FF3D57] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* User Bottom */}
      <div className="p-4 border-t border-white/5 bg-[#0A0A0F]/50">
        <div className="flex items-center justify-between p-2 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white/10">
              <Image src="https://picsum.photos/seed/aryan/100/100" alt="Me" fill sizes="32px" className="object-cover" />
            </div>
            <div className="text-xs font-bold text-white">Aryan Mehta</div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#00E676]/10 text-[#00E676] px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-[#00E676] rounded-full" />
            Online
          </div>
        </div>
      </div>
    </div>
  );
};
