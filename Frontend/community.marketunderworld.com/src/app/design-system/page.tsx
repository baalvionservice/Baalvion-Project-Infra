"use client"

import { NexusButton } from "@/components/ui/nexus-button"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { Navbar } from "@/components/layout/navbar"
import { Star, ShoppingBag, TrendingUp, Globe, Bitcoin, Search } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"

export default function DesignSystem() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto pt-44 pb-32 px-8 max-w-7xl">
        <header className="mb-24">
          <NexusBadge variant="info" className="mb-6">Elite Standard 2.0</NexusBadge>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight nexus-gradient-text">Nexus Design</h1>
          <p className="text-[#A0A0B8] text-xl font-medium max-w-2xl">The elite visual foundation of the NEXUS global infrastructure. Engineered for speed, security, and world-class aesthetics.</p>
        </header>

        {/* Buttons */}
        <section className="mb-24">
          <h2 className="text-xl font-bold mb-10 text-[#5A5A7A] uppercase tracking-[0.2em]">Action Components</h2>
          <div className="flex flex-wrap gap-8 items-center bg-[#16161F] p-12 rounded-3xl border border-[#2A2A3A]">
            <NexusButton variant="primary">Primary Action</NexusButton>
            <NexusButton variant="secondary">Secondary Link</NexusButton>
            <NexusButton variant="outline">Outline Style</NexusButton>
            <NexusButton variant="danger">Destructive</NexusButton>
            <NexusButton variant="vip">VIP Access</NexusButton>
            <NexusButton isLoading variant="primary">Processing</NexusButton>
            <NexusButton 
              variant="outline" 
              onClick={() => toast({ title: "System Alert", description: "This is a polished toast notification." })}
            >
              Trigger Toast
            </NexusButton>
          </div>
        </section>

        {/* Search Callout */}
        <section className="mb-24">
          <NexusCard className="p-12 border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Search className="w-32 h-32" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Universal Command</h3>
            <p className="text-[#A0A0B8] mb-8 max-w-xl">Press <kbd className="nexus-code">Cmd+K</kbd> anywhere to trigger the global search protocol. Designed for instant access to every node in the ecosystem.</p>
            <NexusButton variant="primary" onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}>Try Cmd+K Search</NexusButton>
          </NexusCard>
        </section>

        {/* Cards */}
        <section className="mb-24">
          <h2 className="text-xl font-bold mb-10 text-[#5A5A7A] uppercase tracking-[0.2em]">Visual Containers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <NexusCard variant="base" className="p-10">
              <h3 className="text-2xl font-bold mb-4">Standard Node</h3>
              <p className="text-[#A0A0B8] mb-8 font-medium leading-relaxed">Clean, spacious layout for high-density information. Features subtle dark borders and 24px radius corners for a professional feel.</p>
              <NexusButton variant="outline" size="sm">Review Logs</NexusButton>
            </NexusCard>

            <NexusCard variant="stats" className="group">
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-[#00D4FF]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <NexusBadge variant="success">+12.4%</NexusBadge>
              </div>
              <div className="text-5xl font-bold mb-2 tracking-tighter">0.842 ETH</div>
              <div className="text-[11px] font-bold text-[#5A5A7A] uppercase tracking-[0.2em]">Portfolio Growth</div>
            </NexusCard>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-24">
          <h2 className="text-xl font-bold mb-10 text-[#5A5A7A] uppercase tracking-[0.2em]">Typography Standards</h2>
          <div className="space-y-12 bg-[#16161F] p-16 rounded-3xl border border-[#2A2A3A]">
            <div>
              <div className="text-[11px] text-[#5A5A7A] mb-6 font-bold uppercase tracking-widest">Large Title / 72px</div>
              <div className="text-7xl font-bold tracking-tight nexus-gradient-text leading-[1.1]">Elite Visuals.</div>
            </div>
            <div>
              <div className="text-[11px] text-[#5A5A7A] mb-6 font-bold uppercase tracking-widest">Heading 2 / 48px</div>
              <div className="text-5xl font-bold text-white leading-tight">Handled with precision.</div>
            </div>
            <div>
              <div className="text-[11px] text-[#5A5A7A] mb-6 font-bold uppercase tracking-widest">Monospace / Mono</div>
              <div className="nexus-code text-lg">0x71C7656EC7ab88b098defB751B7401B5f6d8976F</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
