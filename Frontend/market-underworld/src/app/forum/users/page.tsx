
"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  User, 
  Award, 
  MessageSquare, 
  Heart, 
  ArrowUp, 
  ArrowDown, 
  UserPlus, 
  Mail, 
  ShieldCheck, 
  Zap, 
  Crown,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

/**
 * @fileOverview Notable Members page with dynamic high-fidelity hover cards and links to profiles.
 */

interface UserData {
  id: string;
  name: string;
  avatar: string;
  role: string;
  registrationDate: string;
  messages: string;
  reactions: string;
  totalSales: string;
  totalPurchases: string;
  badges: { text: string; color: string; icon?: React.ReactNode }[];
  color?: string;
  icon?: string;
  badgeEmoji?: string;
}

const MOST_MESSAGES: UserData[] = [
  { 
    id: '12377', 
    name: 'Soules', 
    role: 'Moderator',
    registrationDate: 'Aug 3, 2015',
    messages: '13,686', 
    reactions: '19,048',
    totalSales: '$163',
    totalPurchases: '$320,251',
    avatar: 'https://picsum.photos/seed/soules/200/200',
    badges: [
      { text: 'Forum Team', color: 'bg-[#4a5568] text-white' },
      { text: 'Moderator', color: 'bg-[#3498db] text-white', icon: <ShieldCheck size={10} /> },
      { text: 'Lecturer', color: 'bg-[#f1c40f] text-black', icon: <Award size={10} /> },
      { text: 'ShadowMarket', color: 'bg-gradient-to-r from-[#c0ca33] to-[#9eb310] text-black' },
    ]
  },
  { id: 'u2', name: 'WWH_JUDGE', role: 'Staff', registrationDate: 'Jan 12, 2016', messages: '10,870', reactions: '8,420', totalSales: '$420', totalPurchases: '$12,000', avatar: 'https://picsum.photos/seed/u2/200/200', badges: [{ text: 'Staff', color: 'bg-blue-500 text-white' }] },
  { id: 'u3', name: 'martin', role: 'Verified', registrationDate: 'May 20, 2017', messages: '9,661', reactions: '10,998', totalSales: '$1,200', totalPurchases: '$5,400', avatar: 'https://picsum.photos/seed/u3/200/200', badges: [{ text: 'Verified', color: 'bg-green-500 text-white' }] },
  { id: 'u4', name: 'WWH_STUDY', role: 'Member', registrationDate: 'Nov 5, 2018', messages: '7,929', reactions: '4,120', totalSales: '$0', totalPurchases: '$8,200', avatar: 'https://picsum.photos/seed/u4/200/200', badges: [] },
  { id: 'u5', name: 'Leo', role: 'Donor', registrationDate: 'Dec 22, 2019', messages: '7,002', reactions: '12,000', totalSales: '$0', totalPurchases: '$45,000', avatar: 'https://picsum.photos/seed/u5/200/200', icon: '💖', badges: [{ text: 'Donor', color: 'bg-pink-500 text-white' }] },
]

const MOST_GENEROUS: UserData[] = [
  { id: 'u6', name: 'Cash_Big_bro', role: 'Admin', registrationDate: 'Jan 26, 2015', messages: '5,370', reactions: '1,970', totalSales: '$0', totalPurchases: '$8,000', avatar: 'https://picsum.photos/seed/u6/200/200', badgeEmoji: '💎', badges: [{ text: 'Admin', color: 'bg-red-600 text-white' }] },
  { id: 'u7', name: 'Mars Exchange', role: 'Service', registrationDate: 'Feb 14, 2018', messages: '2,140', reactions: '5,600', totalSales: '$120,000', totalPurchases: '$10,000', avatar: 'https://picsum.photos/seed/u7/200/200', color: 'text-purple-500', badges: [{ text: 'Service', color: 'bg-purple-500 text-white' }] },
  { id: 'u8', name: 'LATINKA', role: 'Member', registrationDate: 'Mar 10, 2020', messages: '1,200', reactions: '9,717', totalSales: '$0', totalPurchases: '$2,000', avatar: 'https://picsum.photos/seed/u8/200/200', badgeEmoji: '💎', color: 'text-pink-500', badges: [] },
  { id: 'u9', name: 'Felhathis', role: 'Member', registrationDate: 'Jul 4, 2021', messages: '840', reactions: '6,666', totalSales: '$0', totalPurchases: '$1,500', avatar: 'https://picsum.photos/seed/u9/200/200', badges: [] },
  { id: 'u10', name: 'Best_Scans', role: 'Seller', registrationDate: 'Oct 12, 2022', messages: '420', reactions: '6,020', totalSales: '$45,000', totalPurchases: '$500', avatar: 'https://picsum.photos/seed/u10/200/200', badgeEmoji: '💎', color: 'text-pink-500', badges: [{ text: 'Seller', color: 'bg-orange-500 text-white' }] },
]

export default function NotableMembersPage() {
  const [hoveredUser, setHoveredUser] = useState<UserData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent, user: UserData) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: rect.left, y: rect.top });
    setHoveredUser(user);
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] pb-20 relative">
      <div className="container mx-auto px-4 pt-10">
        <h1 className="text-xl font-medium text-gray-700 mb-6">Notable members</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 space-y-6">
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-100">
                <h2 className="text-sm font-bold text-[#1a2634] uppercase tracking-widest">Users</h2>
              </div>
              <nav className="p-1">
                {['Overview', 'Most messages', 'Most generous', 'Most reactions', "Today's birthdays", 'Forum Team'].map((label, i) => (
                  <button
                    key={label}
                    className={cn(
                      "w-full text-left px-4 py-2 text-[13px] font-medium transition-colors border-l-2",
                      i === 0 
                        ? "bg-gray-100 border-[#1a2634] text-black font-bold" 
                        : "border-transparent text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden text-center p-4 space-y-4">
              <span className="text-xs font-bold text-gray-500 uppercase">Find member</span>
              <input type="text" placeholder="Name..." className="w-full h-9 bg-gray-50 border border-gray-200 rounded px-3 text-xs outline-none focus:border-blue-400 transition-all" />
            </div>
          </aside>

          {/* Main Grid */}
          <main className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LeaderboardCard 
                title="Most messages" 
                data={MOST_MESSAGES} 
                onHover={handleMouseEnter}
                onLeave={() => setHoveredUser(null)}
              />
              <LeaderboardCard 
                title="Most generous" 
                data={MOST_GENEROUS} 
                onHover={handleMouseEnter}
                onLeave={() => setHoveredUser(null)}
              />
              <LeaderboardCard 
                title="Most reactions" 
                data={MOST_MESSAGES} 
                onHover={handleMouseEnter}
                onLeave={() => setHoveredUser(null)}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Dynamic Hover Card */}
      <AnimatePresence>
        {hoveredUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{ 
              position: 'fixed', 
              left: mousePos.x - 20, 
              top: mousePos.y - 320,
              zIndex: 1000 
            }}
            className="w-[420px] pointer-events-none"
          >
            <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden pointer-events-auto">
              <Link href={`/forum/members/${hoveredUser.id}`}>
                <div className="p-6 flex gap-5 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    <img src={hoveredUser.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-[#3498db] mb-1 truncate">{hoveredUser.name}</h3>
                    <div className="text-sm font-medium text-gray-700 mb-4">{hoveredUser.role}</div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {hoveredUser.badges.map((badge, idx) => (
                        <div key={idx} className={cn("px-2 py-1 rounded text-[9px] font-bold uppercase flex items-center gap-1.5 leading-none", badge.color)}>
                          {badge.icon}
                          {badge.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>

              <div className="px-6 py-2 flex justify-between items-center text-[11px] font-medium border-t border-gray-50">
                <span className="text-gray-400">Registration</span>
                <span className="text-gray-600">{hoveredUser.registrationDate}</span>
              </div>

              <div className="p-4 grid grid-cols-4 gap-2 bg-white">
                <StatBox icon={<MessageSquare size={12} />} label="Messages" val={hoveredUser.messages} />
                <StatBox icon={<Heart size={12} />} label="Reactions" val={hoveredUser.reactions} />
                <StatBox icon={<ArrowUp size={12} />} label="Total sales" val={hoveredUser.totalSales} />
                <StatBox icon={<ArrowDown size={12} />} label="Total purchases" val={hoveredUser.totalPurchases} />
              </div>

              <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex gap-2">
                <button className="flex-1 h-9 bg-white border border-gray-200 rounded flex items-center justify-center gap-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  <UserPlus size={14} className="text-gray-400" /> Follow
                </button>
                <Link href={`/forum/correspondence/create?to=${hoveredUser.name}`} className="flex-1">
                  <button className="w-full h-9 bg-white border border-gray-200 rounded flex items-center justify-center gap-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
                    <Mail size={14} className="text-gray-400" /> Start conversation
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LeaderboardCard({ title, data, onHover, onLeave }: { title: string, data: UserData[], onHover: any, onLeave: any }) {
  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm flex flex-col h-fit">
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {data.map((user, i) => (
          <div 
            key={i} 
            className="p-3 flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition-colors"
            onMouseEnter={(e) => onHover(e, user)}
            onMouseLeave={onLeave}
          >
            <Link href={`/forum/members/${user.id}`} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded border border-gray-200 overflow-hidden bg-gray-50">
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-1">
                <span className={cn("text-xs font-bold transition-colors group-hover:text-blue-500", user.color || "text-blue-600 underline decoration-blue-600/30 underline-offset-2")}>
                  {user.name}
                </span>
                {user.badgeEmoji && <span className="text-xs">{user.badgeEmoji}</span>}
                {user.icon && <span className="text-[10px]">{user.icon}</span>}
              </div>
            </Link>
            <span className="text-xs font-mono text-gray-500">{user.messages || user.reactions}</span>
          </div>
        ))}
      </div>
      <button className="w-full py-2 bg-gray-50/50 border-t border-gray-100 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase">
        See more...
      </button>
    </div>
  )
}

function StatBox({ icon, label, val }: { icon: React.ReactNode; label: string; val: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5 space-y-1">
      <div className="flex items-center gap-1.5 text-gray-400">
        {icon}
        <span className="text-[8px] font-bold uppercase tracking-tighter truncate">{label}</span>
      </div>
      <div className="text-sm font-black text-black leading-none">{val}</div>
    </div>
  )
}
