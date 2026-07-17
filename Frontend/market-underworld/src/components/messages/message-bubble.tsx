
"use client"

import { ChatMessage, MessageStatus } from "@/lib/mock-messages-data";
import { cn } from "@/lib/utils";
import { FileIcon, Download, Check, CheckCheck, Play, Copy } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface MessageBubbleProps {
  message: ChatMessage;
  isSequential?: boolean;
}

export const MessageBubble = ({ message, isSequential }: MessageBubbleProps) => {
  const isMe = message.senderId === 'me';
  const isSystem = message.senderRole === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-[#0D0D14] border border-white/5 rounded-full px-4 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full mb-1",
        isMe ? "justify-end" : "justify-start",
        !isSequential && "mt-4"
      )}
    >
      <div className={cn(
        "flex max-w-[70%] group",
        isMe ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        {!isMe && (
          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 mt-auto mr-3">
            {!isSequential && <Image src={message.senderAvatar} alt={message.senderName} fill sizes="32px" className="object-cover" />}
          </div>
        )}

        {/* Content */}
        <div className={cn(
          "flex flex-col",
          isMe ? "items-end" : "items-start"
        )}>
          {/* Name Label */}
          {!isMe && !isSequential && (
            <span className="text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-widest">
              {message.senderName}
            </span>
          )}

          {/* Bubble */}
          <div className={cn(
            "relative px-4 py-2.5 rounded-2xl transition-all",
            isMe 
              ? "bg-gradient-to-br from-[#6C63FF] to-[#5855E0] text-white rounded-tr-sm" 
              : "bg-[#1C1C28] border border-white/5 text-[#E8E8F0] rounded-tl-sm shadow-lg",
            isSequential && (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl")
          )}>
            {/* Render based on type */}
            {message.type === 'text' && <p className="text-sm leading-relaxed">{message.text}</p>}
            
            {message.type === 'image' && (
              <div className="space-y-2">
                <img src={message.mediaUrl} alt="Attached" className="rounded-lg max-w-full h-auto" />
                {message.text && <p className="text-sm">{message.text}</p>}
              </div>
            )}

            {message.type === 'file' && (
              <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-blue-400">
                  <FileIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">{message.fileName}</div>
                  <div className="text-[10px] text-gray-500">{message.fileSize}</div>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}

            {message.type === 'voice' && (
              <div className="flex items-center gap-3 w-48">
                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <Play className="w-4 h-4 fill-current" />
                </button>
                <div className="flex-1 flex items-center gap-0.5 h-6">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-white/20 rounded-full" style={{ height: `${Math.random() * 80 + 20}%` }} />
                  ))}
                </div>
                <span className="text-[10px] font-mono">0:34</span>
              </div>
            )}

            {/* Reactions Overlay */}
            {message.reactions && (
              <div className="absolute -bottom-2 right-2 flex gap-1 bg-[#16161F] border border-white/10 rounded-full px-1.5 py-0.5 shadow-xl">
                {Object.entries(message.reactions).map(([emoji, count]) => (
                  <span key={emoji} className="text-[10px] flex items-center gap-1">
                    {emoji} <span className="text-gray-500">{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="flex items-center gap-2 mt-1 px-1">
            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">
              {message.timestamp}
            </span>
            {isMe && <MessageStatusIndicator status={message.status} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function MessageStatusIndicator({ status }: { status: MessageStatus }) {
  if (status === 'sending') return <div className="w-2.5 h-2.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />;
  if (status === 'sent') return <Check className="w-3 h-3 text-gray-600" />;
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-gray-600" />;
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-cyan-400" />;
  return null;
}
