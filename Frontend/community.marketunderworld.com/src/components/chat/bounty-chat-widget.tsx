"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { MessageSquare, X, Send, Skull } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBountyThread } from './use-bounty-thread';

export function BountyChatWidget() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, error, sending, send } = useBountyThread(isAuthenticated && isOpen);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!isAuthenticated) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (await send(text)) setInput('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open bounty chat"
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] transition-transform hover:scale-110"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] z-[9999] bg-[#0B0C0F] border border-red-600/50 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.2)] flex flex-col overflow-hidden"
          >
            <div className="bg-red-950/80 p-4 border-b border-red-600/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skull className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="font-bold text-white text-sm">Bounty Chat</h3>
                  <p className="text-[10px] text-red-400 font-mono">Private thread with the admin team</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Close" className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40">
              {messages.length === 0 && !error && (
                <p className="text-xs text-gray-500 text-center pt-8">No messages yet. Replies from the admin team appear here; they are not instant.</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.fromAdmin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm whitespace-pre-wrap break-words ${msg.fromAdmin ? 'bg-[#1A1D24] border border-[#252A33] text-gray-200 rounded-bl-none' : 'bg-red-600/20 border border-red-500/30 text-white rounded-br-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {error && <p role="alert" className="px-4 py-2 text-xs text-red-400 bg-red-950/30 border-t border-red-600/20">{error}</p>}

            <form onSubmit={handleSend} className="p-4 bg-[#0B0C0F] border-t border-red-600/20 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message the admin team..."
                maxLength={4000}
                className="flex-1 bg-black/50 border border-[#252A33] rounded-lg px-3 text-sm text-white focus:border-red-500 outline-none"
              />
              <button type="submit" disabled={sending} aria-label="Send" className="w-10 h-10 bg-red-600 hover:bg-red-500 disabled:opacity-60 rounded-lg flex items-center justify-center text-white shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
