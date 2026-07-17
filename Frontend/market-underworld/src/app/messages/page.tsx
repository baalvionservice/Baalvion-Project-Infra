
"use client"

import { Navbar } from "@/components/layout/navbar";
import { MessagesSidebar } from "@/components/messages/sidebar";
import { ChatWindow } from "@/components/messages/chat-window";
import { DetailPanel } from "@/components/messages/detail-panel";
import { CONVERSATIONS, Conversation } from "@/lib/mock-messages-data";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id);
  const activeConversation = CONVERSATIONS.find(c => c.id === activeId) || CONVERSATIONS[0];

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0F] overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex pt-20 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[280px] shrink-0 h-full border-r border-white/5">
          <MessagesSidebar activeId={activeId} onSelect={setActiveId} />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 h-full flex overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 h-full flex overflow-hidden"
            >
              <ChatWindow conversation={activeConversation} />
              
              {/* Detail Panel */}
              <div className="hidden lg:block">
                <DetailPanel conversation={activeConversation} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global CSS for scrollbars */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
