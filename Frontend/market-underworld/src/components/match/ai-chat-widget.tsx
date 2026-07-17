
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Sparkles } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"

const FALLBACK_RESPONSES = [
  "Great question! Based on your profile, I'd recommend focusing on Priya Sharma first. Her 98% match score is exceptional — try booking a trial class to confirm the fit!",
  "Looking at your preferences, the key factor is your exam timeline. Teachers with competitive exam experience like Priya and Anita will serve you best.",
  "I've cross-referenced your availability with all 343 teachers. Your evening + weekend preference gives you access to 89% of our teacher pool — great flexibility!",
]

export const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi Aryan! I've analyzed your preferences and found 5 great matches. Do you have any questions about your results?" }
  ])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [fallbackIndex, setFallbackIndex] = useState(0)

  const handleSend = (text: string = input) => {
    if (!text.trim()) return
    
    setMessages(prev => [...prev, { role: "user", text }])
    setInput("")
    setIsThinking(true)

    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: FALLBACK_RESPONSES[fallbackIndex] }])
      setFallbackIndex((prev) => (prev + 1) % FALLBACK_RESPONSES.length)
      setIsThinking(false)
    }, 1500)
  }

  return (
    <div className="fixed bottom-10 right-10 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-6 w-[360px]"
          >
            <NexusCard className="p-0 overflow-hidden border-[#6C63FF]/30 shadow-3xl">
              <div className="p-4 bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="font-bold text-sm text-white">NEXUS AI Assistant</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="h-[380px] overflow-y-auto p-4 space-y-4 bg-[#0D0D14]/90 backdrop-blur-xl no-scrollbar">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-[#6C63FF] text-white' 
                        : 'bg-white/5 border border-white/10 text-[#A0A0B8]'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex gap-1">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-cyan-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-cyan-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-cyan-400 rounded-full" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 bg-[#0A0A0F]">
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Why is Priya #1?", "Show cheaper options", "Compare #1 and #2"].map(btn => (
                    <button 
                      key={btn}
                      onClick={() => handleSend(btn)}
                      className="text-[10px] font-bold text-cyan-400 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 hover:bg-cyan-400/20 transition-all"
                    >
                      {btn}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask anything..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-[#6C63FF]/50"
                  />
                  <button 
                    onClick={() => handleSend()}
                    className="w-10 h-10 rounded-xl bg-[#6C63FF] flex items-center justify-center text-white"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </NexusCard>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#00D4FF] flex items-center justify-center text-white shadow-3xl shadow-[#6C63FF]/30 relative"
      >
        <MessageSquare className="w-8 h-8" />
        <div className="absolute inset-0 rounded-full animate-pulse-glow bg-[#6C63FF] -z-10 blur-xl opacity-50" />
      </motion.button>
    </div>
  )
}
