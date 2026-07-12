
"use client"

import React, { use, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, 
  MessageSquare, 
  Heart, 
  ArrowUp, 
  ArrowDown, 
  UserPlus, 
  Mail, 
  ChevronDown, 
  Calendar, 
  Award, 
  Crown, 
  Shield,
  Search,
  HandCoins,
  Gavel,
  History,
  FileText,
  Info,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

/**
 * @fileOverview High-fidelity member profile page matching the XenForo reference.
 */

const PROFILE_DATA = {
  id: '12377',
  name: 'Soules',
  role: 'Moderator',
  registrationDate: '3 Aug 2015',
  avatar: 'https://picsum.photos/seed/soules/400/400',
  stats: [
    { label: 'Messages', val: '13,686', icon: <MessageSquare size={14} /> },
    { label: 'Reactions', val: '19,048', icon: <Heart size={14} /> },
    { label: 'Total sales', val: '$163', icon: <ArrowUp size={14} /> },
    { label: 'Total purchases', val: '$320,251', icon: <ArrowDown size={14} /> },
    { label: 'Donated', val: '$0', icon: <HandCoins size={14} /> },
    { label: 'Guarantee', val: '3', icon: <ShieldCheck size={14} /> },
  ],
  banners: [
    { text: 'Forum Team', color: 'bg-[#4a5568]' },
    { text: 'Moderator', color: 'bg-[#3498db]', icon: <Shield size={12} /> },
    { text: 'Lecturer', color: 'bg-[#f1c40f] text-black', icon: <Award size={12} /> },
    { text: 'ShadowMarket', color: 'bg-gradient-to-r from-[#c0ca33] to-[#9eb310] text-black' },
    { text: 'Verified', color: 'bg-[#27ae60]', icon: <CheckCircleIcon size={12} /> },
    { text: 'Member', color: 'bg-orange-500' },
    { text: "10th anniversary", color: "bg-[#ffd700] text-black", icon: <Award size={12} /> },
    { text: "Enroll Group", color: "bg-blue-700" },
    { text: "Corner of the Trapezoid", color: "bg-blue-900" },
    { text: "AutoGarant: 3", color: "bg-gray-800" },
  ]
}

const PROFILE_POSTS = [
  {
    id: 1,
    author: 'lodgeofmillion',
    avatar: 'https://picsum.photos/seed/lodge/100/100',
    content: 'Сразу заметно, что человек начитанный, образованный. Таки, некий интеллектуал в сфере каржа.\n\nСтарается ответить и по факту, и дает пищу для размышлений на другие темы.\nНе дает рыбку на золотой тарелке, но старается обучить тому, как сделать золотую удочку и начать ловить рыбу...',
    date: '15 Dec 2025',
    likes: 1
  },
  {
    id: 2,
    author: 'summerxy',
    avatar: 'https://picsum.photos/seed/summer/100/100',
    content: 'Excellent support and fast response. A true asset to the community.',
    date: '28 Aug 2025',
    likes: 12
  }
]

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState('Profile posts');
  const [isFindOpen, setIsFindOpen] = useState(false);

  const tabs = [
    'Profile posts', 'Last activity', 'Postings', 'Information', 'Open arbitrations', 'All arbitrations'
  ];

  return (
    <div className="min-h-screen bg-[#edf2f7] pb-20">
      <div className="container mx-auto px-4 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
          
          {/* Left Column: Sidebar */}
          <aside className="space-y-4">
            <div className="bg-white rounded p-4 border border-gray-200 shadow-sm">
              <div className="aspect-square rounded overflow-hidden border border-gray-100 mb-4">
                <img src={PROFILE_DATA.avatar} alt={PROFILE_DATA.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="space-y-1.5">
                {PROFILE_DATA.banners.map((banner, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-full py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 text-white border border-white/5",
                      banner.color
                    )}
                  >
                    {banner.icon}
                    {banner.text}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Column: Profile Content */}
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded border border-gray-200 shadow-sm p-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-[#1a2634] mb-1">{PROFILE_DATA.name}</h1>
                    <div className="text-sm font-medium text-gray-500">{PROFILE_DATA.role}</div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 text-[13px] text-gray-500">
                    <span className="flex items-center gap-2">Registration: <span className="font-bold text-black">{PROFILE_DATA.registrationDate}</span></span>
                    <button className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded border border-gray-200 hover:bg-gray-200 transition-all font-bold text-black text-xs">
                      <MessageSquare size={12} /> All messages {PROFILE_DATA.name}
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded border border-gray-200 hover:bg-gray-200 transition-all font-bold text-black text-xs">
                      <FileText size={12} /> All topics {PROFILE_DATA.name}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-8">
                {PROFILE_DATA.stats.map((stat, i) => (
                  <div key={i} className="bg-gray-50/80 border border-gray-100 rounded p-3 space-y-1">
                    <div className="flex items-center gap-2 text-gray-400">
                      {stat.icon}
                      <span className="text-[9px] font-bold uppercase tracking-tighter truncate">{stat.label}</span>
                    </div>
                    <div className="text-lg font-black text-[#1a2634] leading-none">{stat.val}</div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-8 pt-8 border-t border-gray-100">
                <button className="h-10 px-6 bg-gray-100 border border-gray-200 rounded flex items-center gap-2 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-all">
                  <UserPlus size={14} className="text-gray-400" /> Subscribe
                </button>
                <Link href={`/forum/correspondence/create?to=${PROFILE_DATA.name}`}>
                  <button className="h-10 px-6 bg-gray-100 border border-gray-200 rounded flex items-center gap-2 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-all">
                    <Mail size={14} className="text-gray-400" /> Start conversation
                  </button>
                </Link>
                
                {/* Find Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsFindOpen(!isFindOpen)}
                    className={cn(
                      "h-10 px-4 border border-gray-200 rounded flex items-center text-xs font-bold text-gray-600 transition-all",
                      isFindOpen ? "bg-white" : "bg-gray-100 hover:bg-gray-200"
                    )}
                  >
                    Find <ChevronDown size={14} className={cn("ml-2 transition-transform", isFindOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isFindOpen && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setIsFindOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute top-full mt-2 left-0 w-64 bg-[#fefefe] border border-gray-300 shadow-[0_5px_15px_rgba(0,0,0,0.1)] z-[110] rounded-sm overflow-hidden"
                        >
                          {/* Dark Caret/Arrow */}
                          <div className="absolute -top-[6px] left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#333]" />
                          
                          <div className="relative border-t-[3px] border-t-[#333]">
                            <button 
                              onClick={() => setIsFindOpen(false)}
                              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-[#edf2f7] hover:text-[#1a2634] transition-colors border-b border-gray-100"
                            >
                              Search for publications
                            </button>
                            <button 
                              onClick={() => setIsFindOpen(false)}
                              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-[#edf2f7] hover:text-[#1a2634] transition-colors border-b border-gray-100"
                            >
                              Find all posts by {PROFILE_DATA.name}
                            </button>
                            <button 
                              onClick={() => setIsFindOpen(false)}
                              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-[#edf2f7] hover:text-[#1a2634] transition-colors"
                            >
                              Find all threads about {PROFILE_DATA.name}
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Tabs & Content */}
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50/50 border-b border-gray-100 flex overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-6 py-4 text-[13px] font-bold whitespace-nowrap border-b-2 transition-all",
                      activeTab === tab 
                        ? "border-[#1a2634] text-[#1a2634]" 
                        : "border-transparent text-gray-500 hover:text-black hover:bg-gray-100/50"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-0">
                <AnimatePresence mode="wait">
                  {activeTab === 'Profile posts' && (
                    <motion.div
                      key="posts"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="divide-y divide-gray-100"
                    >
                      {PROFILE_POSTS.map(post => (
                        <div key={post.id} className="p-8 flex gap-6 hover:bg-gray-50/30 transition-all group">
                          <div className="w-12 h-12 rounded overflow-hidden border border-gray-100 shrink-0">
                            <img src={post.avatar} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-blue-600 hover:underline cursor-pointer">{post.author}</span>
                              <span className="text-[11px] font-bold text-gray-400 uppercase">{post.date}</span>
                            </div>
                            <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-4 pt-2">
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <Heart size={14} />
                                <span className="text-[11px] font-bold">{post.likes} user</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                  {activeTab !== 'Profile posts' && (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-20 text-center space-y-4"
                    >
                      <Info className="w-12 h-12 text-gray-200 mx-auto" />
                      <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Protocol node initialized. No data found in this sector.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  )
}
