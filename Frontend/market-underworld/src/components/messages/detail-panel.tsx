
"use client"

import { Conversation } from "@/lib/mock-messages-data";
import { cn } from "@/lib/utils";
import { 
  Video, 
  User, 
  ShieldAlert, 
  Image as ImageIcon, 
  FileText, 
  Link as LinkIcon, 
  CreditCard,
  Star,
  ChevronRight,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import NextImage from "next/image";

interface DetailPanelProps {
  conversation: Conversation;
}

export const DetailPanel = ({ conversation }: DetailPanelProps) => {
  const [activeTab, setActiveTab] = useState("Media");

  return (
    <div className="w-[300px] h-full bg-[#0D0D14] border-l border-white/5 flex flex-col overflow-y-auto no-scrollbar">
      {/* Profile Header */}
      <div className="p-8 text-center border-b border-white/5">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          key={conversation.id}
          className="relative inline-block mb-6"
        >
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 p-1 bg-white/5">
            <div className="relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center text-3xl">
              {conversation.avatar.length > 2 ? <NextImage src={conversation.avatar} alt="" fill sizes="96px" className="object-cover" /> : conversation.avatar}
            </div>
          </div>
          <div className={cn(
            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#0D0D14]",
            conversation.status === 'online' ? "bg-[#00E676]" : "bg-gray-600"
          )} />
        </motion.div>
        <h3 className="text-lg font-bold text-white mb-1">{conversation.name}</h3>
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">
          {conversation.role} • {conversation.country}
        </div>

        <div className="flex gap-2">
          {conversation.role === 'teacher' && (
            <button className="flex-1 py-2 rounded-xl bg-blue-600/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-600/20 hover:bg-blue-600 hover:text-white transition-all">
              Start Class
            </button>
          )}
          <button className="flex-1 py-2 rounded-xl bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-widest border border-white/5 hover:bg-white/10 hover:text-white transition-all">
            Profile
          </button>
        </div>
      </div>

      {/* Ratings/Info */}
      {conversation.rating && (
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rating</span>
            <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
              <Star className="w-4 h-4 fill-amber-500" /> {conversation.rating}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Avg Response</span>
            <span className="text-xs font-bold text-white">~1 hour</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="p-4 flex-1">
        <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/5 mb-6">
          {["Media", "Files", "Links"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                activeTab === tab ? "bg-[#16161F] text-blue-400 shadow-lg" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {activeTab === 'Media' && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group">
                  <NextImage src={`https://picsum.photos/seed/msg-media-${i}/100/100`} fill sizes="120px" className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Files' && (
            <div className="space-y-2">
              {[
                { name: 'Syllabus_Chemistry.pdf', size: '1.2 MB' },
                { name: 'Homework_Week4.docx', size: '450 KB' },
              ].map((file, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-blue-500/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-white truncate max-w-[120px]">{file.name}</div>
                      <div className="text-[8px] text-gray-500 uppercase">{file.size}</div>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Links' && (
            <div className="space-y-2">
              {[
                { title: 'Periodic Table Interactive', url: 'chemistry.io/table' },
                { title: 'Faraday Laws Guide', url: 'khanacademy.org/...' },
              ].map((link, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1 hover:border-blue-500/20 transition-all cursor-pointer">
                  <div className="text-[10px] font-bold text-white truncate">{link.title}</div>
                  <div className="text-[8px] text-blue-400 truncate">{link.url}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 border-t border-white/5 space-y-3">
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-500/5 text-gray-500 hover:text-red-400 transition-all group text-[10px] font-bold uppercase tracking-widest">
          <span>Block User</span>
          <ShieldAlert className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
};
