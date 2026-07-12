"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldAlert, 
  Lock, 
  ChevronDown, 
  ChevronRight, 
  Users, 
  MessageSquare, 
  Star, 
  DollarSign, 
  Calendar,
  Award,
  Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdvertisingPage() {
  return (
    <div className="min-h-screen bg-[#1a2634] pb-20">
      <div className="container mx-auto px-6 pt-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-tight mb-6">
          <span className="hover:text-white cursor-pointer">Forums</span>
          <ChevronRight size={10} />
          <span className="hover:text-white cursor-pointer">Rules/Reviews/Manuals for working with the project.</span>
          <ChevronRight size={10} />
          <span className="text-gray-400">Project rules/How to use the project!</span>
        </div>

        {/* Topic Header */}
        <div className="bg-[#111b26] border border-white/10 p-6 rounded-t-lg flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#ffd700] text-black text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase">RULES</span>
              <h1 className="text-2xl font-bold text-gray-200">Advertising on the Market Underworld project (2025 edition)</h1>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-[#FF3D57]"><Users size={12} /> ADVERTISING</span>
              <span className="flex items-center gap-1.5"><Calendar size={12} /> January 10, 2019</span>
            </div>
          </div>
        </div>

        {/* Locked Notice */}
        <div className="bg-[#2c2c2c] border-x border-white/10 p-3 px-6 flex items-center gap-3">
          <Lock size={12} className="text-gray-400" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">New replies are no longer allowed in this topic.</span>
        </div>

        {/* Post Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] bg-[#111b26] border border-white/10 rounded-b-lg overflow-hidden">
          {/* Sidebar */}
          <aside className="bg-[#16202c] p-6 flex flex-col items-center text-center space-y-6 border-r border-white/5">
            <div className="relative group">
              <div className="w-24 h-32 bg-[#2c3e50] rounded-lg overflow-hidden border border-white/10">
                <img 
                  src="https://placehold.co/200x300/1a2634/white?text=ADMIN" 
                  alt="Avatar" 
                  className="w-full h-full object-cover grayscale opacity-80"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#16202c]" />
            </div>

            <div className="space-y-1 w-full">
              <div className="text-[11px] font-black text-[#FF3D57] uppercase tracking-[0.2em] mb-2">ADVERTISING</div>
              <p className="text-[10px] text-gray-500 font-bold leading-tight uppercase">I am responsible for Advertising/Duty.</p>
            </div>

            <div className="w-full space-y-2">
              <div className="bg-[#2c3e50] text-[10px] font-bold text-white py-1.5 rounded uppercase tracking-widest border border-white/5">Forum Team</div>
              <div className="bg-[#c0392b] text-[10px] font-bold text-white py-1.5 rounded uppercase tracking-widest border border-white/5">Administrator</div>
            </div>

            <div className="flex items-center gap-2 text-[#ffd700] text-[10px] font-bold uppercase tracking-widest">
              <Award size={14} /> The forum's 10th anniversary
            </div>

            <div className="w-full pt-6 border-t border-white/5 space-y-2 text-left">
              <StatRow label="Registration:" val="January 26, 2015" />
              <StatRow label="Messages:" val="5,370" />
              <StatRow label="Reactions:" val="1,970" />
              <StatRow label="Total sales:" val="$0" color="text-red-500" />
              <StatRow label="General purchases:" val="$0" color="text-red-500" />
              <StatRow label="Donated:" val="$0" color="text-red-500" />
            </div>
          </aside>

          {/* Main Content */}
          <article className="p-10 lg:p-16 bg-[#1a2634] relative">
            <div className="absolute top-4 right-6 flex items-center gap-4 text-[10px] font-bold text-gray-600 uppercase">
              <span>January 10, 2019</span>
              <span className="hover:text-white cursor-pointer">#1</span>
            </div>

            <div className="space-y-12">
              {/* Header Group */}
              <div className="space-y-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="text-7xl font-black tracking-tighter flex items-center gap-2">
                    <span className="text-white">MARKET</span>
                    <span className="text-[#3498db]">UNDERWORLD</span>
                  </div>
                  <div className="text-xl font-bold text-gray-500 tracking-[0.3em] uppercase mt-2">
                    МЕСТО ВСТРЕЧИ ПРОФЕССИОНАЛОВ
                  </div>
                </div>
              </div>

              {/* Main Body Text */}
              <div className="max-w-4xl mx-auto space-y-8 text-left text-gray-300 leading-relaxed font-medium">
                <p className="text-lg text-center">
                  <strong className="text-white">MARKET UNDERWORLD</strong> is the leader in the number of active dark web users. Over the past 12 years of the forum's existence, the average annual growth rate of active users has been <span className="text-red-500 font-black">&lt;60%</span>.
                </p>
                <p className="text-lg text-center">
                  Building your business on our platform means stable growth for your project and confidence in its future growth. <strong className="text-white">MARKET UNDERWORLD</strong> knows 80% of active dark web users, and the importance of reviews on our platform allows you to further develop.
                </p>
                <p className="text-lg text-center">
                  <strong className="text-white">MARKET UNDERWORLD</strong> has <span className="text-red-500 font-black">653,000 users</span>, with <span className="text-red-500 font-black">112,000 active users</span> in the last 72 hours.
                </p>
              </div>

              {/* Options Header */}
              <div className="py-8 text-center">
                <p className="text-[#3498db] text-xl font-black uppercase tracking-tight mb-4">
                  To help you quickly grow your business, we offer several advertising design options.
                </p>
                <SpoilerButton label="Spoiler: ENG" />
              </div>

              {/* Advertising Options List */}
              <div className="space-y-12 max-w-4xl mx-auto">
                {/* Option 1 */}
                <div className="space-y-4">
                  <h3 className="text-[#3498db] text-lg font-bold italic leading-tight">
                    - [New] Sending advertising messages in notifications to the entire user base on the MARKET UNDERWORLD project* <br />
                    <span className="text-[#3498db]">654,000 users. (a small town of your own)</span>
                  </h3>
                  <div className="space-y-1">
                    <p className="text-red-500 font-black text-lg">Price: $500/mailing.</p>
                    <p className="text-gray-400 text-xs font-bold italic">*must have a topic on our site</p>
                  </div>
                  <div className="flex gap-2">
                    <SpoilerButton label="Spoiler: ENG" />
                    <SpoilerButton label="Spoiler: Photo" icon={<ImageIcon size={12} />} />
                  </div>
                </div>

                {/* Option 2 */}
                <div className="space-y-4">
                  <h3 className="text-[#3498db] text-lg font-bold italic leading-tight">
                    - [New] A separate tab in the navigation block for your service with a link to the topic. <br />
                    <span className="text-[#3498db]">A custom button on the platform's main page.</span>
                  </h3>
                  <p className="text-red-500 font-black text-lg">Price: from $500/month.</p>
                  <div className="flex gap-2">
                    <SpoilerButton label="Spoiler: ENG" />
                    <SpoilerButton label="Spoiler: Photo" icon={<ImageIcon size={12} />} />
                  </div>
                </div>

                {/* Option 3 */}
                <div className="space-y-4">
                  <h3 className="text-[#3498db] text-lg font-bold italic leading-tight">
                    - [New] Forum header. Rotation. Generates a large flow of traffic to your topic.
                  </h3>
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs font-bold">Size: 1870x120; formats: .jpg, .png, .gif; weight no more than 500 KB.</p>
                    <p className="text-red-500 font-black text-lg">Price: $2,500/month.</p>
                  </div>
                  <div className="flex gap-2">
                    <SpoilerButton label="Spoiler: ENG" />
                    <SpoilerButton label="Spoiler: Photo" icon={<ImageIcon size={12} />} />
                  </div>
                </div>

                {/* Option 4 */}
                <div className="space-y-4">
                  <h3 className="text-[#3498db] text-lg font-bold italic leading-tight">
                    - [New] In my signature, in all my messages, in all topics where it is indicated that the fee has been paid, as well as in all correspondence in which I am present:
                  </h3>
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs font-bold">size: 935x60; format: .jpg, .png, .gif; weight no more than 300kb</p>
                    <p className="text-red-500 font-black text-lg">Price: $1,666/month.</p>
                  </div>
                  <div className="flex gap-2">
                    <SpoilerButton label="Spoiler: ENG" />
                    <SpoilerButton label="Spoiler: Photo" icon={<ImageIcon size={12} />} />
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5 w-full mt-20" />
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, val, color = "text-gray-400" }: any) {
  return (
    <div className="flex justify-between items-center text-[10px] font-bold">
      <span className="text-gray-600 uppercase">{label}</span>
      <span className={cn("text-right", color)}>{val}</span>
    </div>
  )
}

function SpoilerButton({ label, icon }: { label: string, icon?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="inline-block">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#2c3e50] hover:bg-[#34495e] text-[10px] font-bold text-gray-300 px-4 py-1.5 rounded border border-white/5 transition-all uppercase tracking-widest flex items-center gap-2"
      >
        {icon}
        {label}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-2 p-4 bg-black/20 rounded border border-white/5 text-left text-sm text-gray-400 italic"
          >
            {label.includes('Photo') ? (
              <div className="w-full aspect-video bg-white/5 rounded flex items-center justify-center border border-white/10">
                <ImageIcon className="text-white/10" size={48} />
                <span className="text-[10px] uppercase ml-2">Preview Image Protocol</span>
              </div>
            ) : (
              "Detailed technical specifications and deployment logic for this advertising protocol are provided upon node authorization."
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
