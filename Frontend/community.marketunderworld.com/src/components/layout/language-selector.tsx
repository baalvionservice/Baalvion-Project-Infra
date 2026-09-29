"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Check, Search, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/context/language-context'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English', flag: '🇬🇧', region: 'Global' },
  { id: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', region: 'MENA', rtl: true },
  { id: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', region: 'East Asia' },
  { id: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', region: 'LatAm / Europe' },
  { id: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', region: 'Europe / Africa' },
  { id: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷', region: 'Latin America' },
  { id: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩', region: 'South Asia' },
]

export const LanguageSelector = () => {
  const { language, setLanguage, dir } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = LANGUAGES.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.native.toLowerCase().includes(search.toLowerCase())
  )

  const current = LANGUAGES.find(l => l.id === language)

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold text-gray-400 hover:text-white"
      >
        <Globe className="w-4 h-4 text-cyan-400" />
        <span className="uppercase">{language}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[190]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={cn(
                "absolute top-full mt-4 w-80 bg-[#16161F] border border-white/10 rounded-2xl shadow-3xl z-[200] overflow-hidden",
                dir === 'rtl' ? "left-0" : "right-0"
              )}
            >
              <div className="p-4 border-b border-white/5">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Select Language</div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                  <input 
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search languages..."
                    className="w-full bg-white/5 border border-white/10 h-10 rounded-xl pl-9 pr-4 text-xs text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 no-scrollbar">
                {filtered.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      setLanguage(lang.id as any)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                      language === lang.id ? "bg-cyan-500/10 text-cyan-400" : "hover:bg-white/5 text-gray-400 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <div className="text-left">
                        <div className="font-bold text-sm">{lang.native}</div>
                        <div className="text-[10px] opacity-60">{lang.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{lang.region}</span>
                      {language === lang.id && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                <button className="text-[10px] font-bold text-cyan-500 uppercase hover:underline">Help us translate NEXUS →</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
