"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { STUDENT_PROFILE, UPCOMING_CLASSES } from "@/lib/mock-student-data"
import { NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Home, 
  BookOpen, 
  Calendar, 
  Wallet, 
  ShoppingBag, 
  MessageSquare, 
  Star, 
  BarChart3, 
  Bell, 
  Settings,
  ChevronRight,
  Plus,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react"
import { motion } from "framer-motion"

const NAV_ITEMS = [
  { name: 'Overview', path: '/student/dashboard', icon: Home },
  { name: 'My Classes', path: '/student/dashboard/classes', icon: BookOpen },
  { name: 'Schedule', path: '/student/dashboard/schedule', icon: Calendar },
  { name: 'Crypto Wallet', path: '/student/dashboard/wallet', icon: Wallet },
  { name: 'Marketplace', path: '/student/dashboard/orders', icon: ShoppingBag },
  { name: 'Messages', path: '/student/dashboard/messages', icon: MessageSquare },
  { name: 'Progress', path: '/student/dashboard/progress', icon: BarChart3 },
  { name: 'Settings', path: '/student/dashboard/settings', icon: Settings },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const nextClass = UPCOMING_CLASSES[0];

  return (
    <div className="flex flex-col h-full p-6 pb-20">
      {/* Profile Section */}
      <div className="mb-10 text-center">
        <div className="relative inline-block mb-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 p-1">
            <img src={STUDENT_PROFILE.avatar} className="w-full h-full object-cover rounded-xl" alt={STUDENT_PROFILE.name} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0A0A0F]" />
        </div>
        <h3 className="font-bold text-lg mb-1">{STUDENT_PROFILE.name}</h3>
        <NexusBadge variant="info" className="bg-white/5 border-white/10">
          {STUDENT_PROFILE.regionId.toUpperCase()} {getFlagEmoji(STUDENT_PROFILE.countryCode)}
        </NexusBadge>
      </div>

      {/* Wallet Widget */}
      <div className="mb-10 p-5 bg-white/[0.03] rounded-2xl border border-white/5">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Wallet Balance</div>
        <div className="text-xl font-bold mb-1">{STUDENT_PROFILE.walletBalance.eth} ETH</div>
        <div className="text-xs text-gray-500 font-bold mb-4">≈ ${STUDENT_PROFILE.walletBalance.usd}</div>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition-all">
            <Plus className="w-3 h-3" /> Deposit
          </button>
          <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 text-gray-400 text-[10px] font-bold hover:bg-white/10 transition-all">
            <ArrowUpRight className="w-3 h-3" /> Withdraw
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link 
            key={item.name} 
            href={item.path}
            className={`flex items-center justify-between p-3 rounded-xl transition-all group ${
              pathname === item.path ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-4 h-4 ${pathname === item.path ? 'text-blue-400' : 'text-gray-500 group-hover:text-white'}`} />
              <span className="text-sm font-bold">{item.name}</span>
            </div>
            {item.name === 'Notifications' && <span className="w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] rounded-full">3</span>}
          </Link>
        ))}
      </nav>

      {/* Quick Teacher Card */}
      <div className="mt-10 pt-10 border-t border-white/5">
        <div className="p-4 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-2xl border border-blue-500/10 relative overflow-hidden group cursor-pointer hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <img src={nextClass.teacherAvatar} className="w-10 h-10 rounded-lg object-cover" alt={nextClass.teacherName} />
            <div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Next Teacher</div>
              <div className="text-sm font-bold">{nextClass.teacherName}</div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-gray-500 mb-4">
             Next class: Today 4PM
          </div>
          <NexusButton size="sm" variant="outline" className="w-full h-8 border-white/10 text-[10px] font-bold">Message</NexusButton>
        </div>
      </div>
    </div>
  )
}

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
