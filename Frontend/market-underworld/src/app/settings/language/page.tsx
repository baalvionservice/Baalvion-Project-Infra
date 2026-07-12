"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { Globe, Check, Info, Layout, MessageSquare, Languages } from 'lucide-react'
import { useLanguage } from '@/context/language-context'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English', flag: '🇬🇧', progress: 100, beta: false },
  { id: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', progress: 94, beta: false, rtl: true },
  { id: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', progress: 96, beta: false },
  { id: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', progress: 95, beta: false },
  { id: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', progress: 91, beta: true },
  { id: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷', progress: 88, beta: true },
  { id: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩', progress: 89, beta: true },
]

export default function LanguageSettingsPage() {
  const { language, setLanguage, dir } = useLanguage()
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: `Language updated to ${LANGUAGES.find(l => l.id === language)?.name}`,
    })
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />

      <main className="container mx-auto pt-44 pb-32 px-8 max-w-5xl space-y-20">
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-cyan-400 font-bold text-sm uppercase tracking-widest">
            <Globe className="w-4 h-4" /> Localization Settings
          </div>
          <h1 className="text-5xl font-bold tracking-tight">Language & Region</h1>
          <p className="text-gray-500 text-lg font-medium max-w-2xl">
            Customize how NEXUS appears for your location and language. We support 7 global languages with full RTL layout capabilities.
          </p>
        </header>

        {/* Interface Language */}
        <section className="space-y-10">
          <div>
            <h2 className="text-2xl font-bold mb-2">Display Language</h2>
            <p className="text-gray-500 text-sm">The language used throughout the NEXUS platform interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id as any)}
                className={cn(
                  "p-6 rounded-3xl border text-left transition-all relative overflow-hidden group",
                  language === lang.id 
                    ? "bg-cyan-500/5 border-cyan-500 shadow-2xl shadow-cyan-500/10" 
                    : "bg-white/[0.02] border-white/5 hover:border-white/20"
                )}
              >
                {language === lang.id && (
                  <div className="absolute top-4 right-4 text-cyan-400">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                <div className="flex items-center gap-6">
                  <div className="text-4xl">{lang.flag}</div>
                  <div>
                    <div className="font-bold text-xl mb-1">{lang.native}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{lang.name}</div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex-1 max-w-[120px] space-y-1.5">
                    <div className="flex justify-between text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                      <span>Translated</span>
                      <span>{lang.progress}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-1000", language === lang.id ? "bg-cyan-400" : "bg-gray-700")} 
                        style={{ width: `${lang.progress}%` }} 
                      />
                    </div>
                  </div>
                  {lang.beta && <NexusBadge className="bg-amber-500/10 text-amber-500 border-none text-[8px]">BETA</NexusBadge>}
                  {lang.rtl && <NexusBadge className="bg-blue-500/10 text-blue-400 border-none text-[8px]">RTL SUPPORT</NexusBadge>}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* RTL Preview */}
        <section className="space-y-8">
          <div className="p-8 bg-amber-500/5 border border-amber-500/20 rounded-3xl flex gap-6">
            <Info className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="space-y-4">
              <h3 className="font-bold text-amber-500">RTL Layout Support</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                NEXUS fully supports Right-to-Left (RTL) reading directions. Selecting Arabic will automatically mirror the navigation, sidebars, and data visualizations for an authentic native experience.
              </p>
              <div className="flex gap-4">
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex-1">
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-4">LTR Layout (EN)</div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20" />
                    <div className="h-2 w-24 bg-white/10 rounded-full" />
                  </div>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex-1" dir="rtl">
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-4 text-right">RTL Layout (AR)</div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20" />
                    <div className="h-2 w-24 bg-white/10 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contribution */}
        <section>
          <NexusCard className="p-10 border-white/5 bg-gradient-to-br from-cyan-500/[0.05] to-transparent flex flex-col md:flex-row items-center gap-12">
            <div className="w-20 h-20 rounded-[2rem] bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
              <Languages className="w-10 h-10" />
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-2xl font-bold">Help Translate NEXUS</h3>
              <p className="text-gray-400 leading-relaxed font-medium">
                NEXUS is translated by our global community. Help us make the platform accessible to everyone in their native tongue.
              </p>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-xl font-bold">47</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contributors</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">12.8k</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Strings Done</div>
                </div>
              </div>
            </div>
            <NexusButton className="nexus-gradient-bg h-14 px-10 font-bold shadow-2xl shadow-cyan-500/20">Become a Contributor</NexusButton>
          </NexusCard>
        </section>

        <div className="pt-12 border-t border-white/5 flex justify-end">
          <NexusButton onClick={handleSave} size="lg" className="px-16 h-16 text-lg font-bold">Save Settings</NexusButton>
        </div>
      </main>

      <Footer />
    </div>
  )
}
