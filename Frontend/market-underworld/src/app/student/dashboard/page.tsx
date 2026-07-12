"use client"

import { useState, useEffect } from "react"
import { 
  STUDENT_PROFILE, 
  UPCOMING_CLASSES, 
  SUBJECT_PROGRESS, 
  RECENT_TRANSACTIONS, 
  MARKETPLACE_ORDERS 
} from "@/lib/mock-student-data"
import { NextClassCard } from "@/components/dashboard/next-class-card"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  BookOpen, 
  Clock, 
  Wallet, 
  Zap, 
  Bell, 
  Search, 
  ChevronRight,
  Plus,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Package,
  Trophy,
  Calendar
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

const CHART_DATA = [
  { name: 'Mon', hours: 2.5 },
  { name: 'Tue', hours: 1.5 },
  { name: 'Wed', hours: 3 },
  { name: 'Thu', hours: 0 },
  { name: 'Fri', hours: 2 },
  { name: 'Sat', hours: 1.5 },
  { name: 'Sun', hours: 2 },
];

export default function StudentDashboard() {
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting("Good Afternoon");
    else if (hour >= 17) setGreeting("Good Evening");
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2 tracking-tight">{greeting}, {STUDENT_PROFILE.name.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 font-medium">Tuesday, March 10, 2026 • Your personal command center.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <NexusButton variant="outline" className="h-12 w-12 p-0 border-white/5 relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A0A0F]" />
            </NexusButton>
          </div>
          <NexusButton className="nexus-gradient-bg h-12 px-8 font-bold">Book New Class</NexusButton>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Classes Done', val: STUDENT_PROFILE.stats.classesCompleted, icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10', trend: '↑ +3 this week' },
          { label: 'Hours Learned', val: STUDENT_PROFILE.stats.hoursLearned, icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10', trend: '↑ +4.5h this week' },
          { label: 'Wallet Balance', val: `${STUDENT_PROFILE.walletBalance.eth} ETH`, icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/10', trend: '↓ -0.02 ETH today' },
          { label: 'Study Streak', val: `${STUDENT_PROFILE.stats.streak} Days`, icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10', trend: '🔥 Keep it up!' },
        ].map((stat, i) => (
          <NexusCard key={i} variant="stats" className="bg-white/[0.02] border-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`text-[10px] font-bold ${stat.trend.startsWith('↑') ? 'text-emerald-500' : stat.trend.startsWith('↓') ? 'text-red-500' : 'text-orange-500'}`}>
                {stat.trend}
              </div>
            </div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-2xl font-bold">{stat.val}</div>
          </NexusCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Main Column */}
        <div className="xl:col-span-2 space-y-12">
          {/* Upcoming Classes */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-500" /> Upcoming Classes
              </h3>
              <Link href="/student/dashboard/schedule" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <NextClassCard session={UPCOMING_CLASSES[0]} />
              </div>
              <div className="md:col-span-4 space-y-4">
                {UPCOMING_CLASSES.slice(1).map((session) => (
                  <NexusCard key={session.id} className="p-5 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-blue-600/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                      </div>
                      <NexusBadge variant="success" className="text-[9px] py-0">CONFIRMED</NexusBadge>
                    </div>
                    <div className="font-bold text-sm mb-1">{session.subject}</div>
                    <div className="text-[11px] text-gray-500 mb-4">{session.teacherName} • {session.duration} min</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(session.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </NexusCard>
                ))}
                <NexusButton variant="outline" className="w-full border-dashed border-white/10 h-24 hover:bg-white/[0.02] text-gray-500 text-xs font-bold">
                  + Book Another Class
                </NexusButton>
              </div>
            </div>
          </section>

          {/* Learning Progress */}
          <section>
             <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Subject Progress
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <NexusCard className="p-8 border-white/5 bg-white/[0.02]">
                <div className="space-y-8">
                  {SUBJECT_PROGRESS.map((sub) => (
                    <div key={sub.name}>
                      <div className="flex justify-between items-end text-sm font-bold mb-3">
                        <div>
                          <span className="text-white block">{sub.name}</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Teacher: {sub.teacher}</span>
                        </div>
                        <span className="text-blue-400">{sub.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${sub.progress}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full nexus-gradient-bg shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        />
                      </div>
                      <div className="mt-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        {sub.topics} topics covered
                      </div>
                    </div>
                  ))}
                </div>
              </NexusCard>

              <NexusCard className="p-8 border-white/5 bg-white/[0.02]">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-widest text-gray-500">Weekly Activity</h4>
                    <div className="text-2xl font-bold">12.5 hrs</div>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                    ↑ +2.4h vs last week
                  </div>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CHART_DATA}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                        {CHART_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </NexusCard>
            </div>
          </section>

          {/* Marketplace & Orders */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <Package className="w-5 h-5 text-purple-500" /> Recent Orders
              </h3>
              <Link href="/student/dashboard/orders" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MARKETPLACE_ORDERS.map((order) => (
                <NexusCard key={order.id} className="p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                   <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                         <Package className="w-5 h-5" />
                       </div>
                       <div>
                         <div className="text-xs font-bold">{order.item}</div>
                         <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{order.store}</div>
                       </div>
                     </div>
                     <NexusBadge variant={order.status === 'Preparing' ? 'live' : 'info'} className="text-[9px] py-0">
                       {order.status.toUpperCase()}
                     </NexusBadge>
                   </div>
                   <div className="flex items-center justify-between pt-4 border-t border-white/5">
                     <div className="text-[10px] font-bold text-gray-500 uppercase">{order.date}</div>
                     <div className="text-sm font-bold text-white">{order.amount}</div>
                   </div>
                </NexusCard>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-12">
          {/* Wallet Widget */}
          <section>
             <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-500" /> Crypto Wallet
            </h3>
            <NexusCard className="p-8 border-white/10 bg-gradient-to-br from-[#1e1e2d] to-[#111118] relative overflow-hidden ring-1 ring-white/5">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 blur-[60px] rounded-full" />
              
              <div className="relative z-10">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Balance</div>
                <div className="text-3xl font-bold mb-1">{STUDENT_PROFILE.walletBalance.eth} ETH</div>
                <div className="text-sm text-gray-500 font-bold mb-6">≈ ${STUDENT_PROFILE.walletBalance.usd}</div>

                <div className="space-y-4 mb-8">
                  {[
                    { coin: 'ETH', name: 'Ethereum', val: STUDENT_PROFILE.walletBalance.eth, price: '$2,447.80', perc: 88 },
                    { coin: 'BTC', name: 'Bitcoin', val: STUDENT_PROFILE.walletBalance.btc, price: '$187.20', perc: 7 },
                    { coin: 'USDT', name: 'Tether', val: STUDENT_PROFILE.walletBalance.usdt, price: '$45.00', perc: 5 },
                  ].map((coin) => (
                    <div key={coin.coin} className="flex justify-between items-center text-xs p-3 bg-black/20 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-blue-400">{coin.coin}</div>
                        <div>
                          <div className="font-bold">{coin.name}</div>
                          <div className="text-[10px] text-gray-500">{coin.val} {coin.coin}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{coin.price}</div>
                        <div className="text-[9px] text-gray-500">{coin.perc}%</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <NexusButton size="sm" className="nexus-gradient-bg h-10 font-bold text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Deposit</NexusButton>
                  <NexusButton size="sm" variant="outline" className="h-10 border-white/10 font-bold text-xs"><ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Withdraw</NexusButton>
                </div>
              </div>
            </NexusCard>
          </section>

          {/* Recent Activity / Transactions */}
          <section>
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" /> Recent Activity
            </h3>
            <div className="space-y-4">
              {RECENT_TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'received' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {tx.type === 'received' ? <Plus className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold group-hover:text-blue-400 transition-colors">{tx.description}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{new Date(tx.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold ${tx.amount.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{tx.amount} {tx.currency}</div>
                    <div className="text-[10px] text-gray-500 font-bold">{tx.status.toUpperCase()}</div>
                  </div>
                </div>
              ))}
              <Link href="/student/dashboard/wallet" className="block text-center text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest pt-2">
                View Full History →
              </Link>
            </div>
          </section>

          {/* Achievements */}
          <section>
             <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-gold-500 text-yellow-500" /> Achievements
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: '7 Day Streak', icon: '🔥', color: 'orange' },
                { name: '20 Classes', icon: '📚', color: 'blue' },
                { name: 'First Review', icon: '⭐', color: 'yellow' },
              ].map((ach) => (
                <div key={ach.name} className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-blue-500/20 transition-all">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{ach.icon}</div>
                  <div className="text-[8px] font-bold text-gray-500 uppercase text-center leading-tight">{ach.name}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Messages Preview */}
          <section>
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-500" /> Recent Messages
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Priya Sharma', msg: 'See you at 4PM today! I\'ve prepared...', time: '2h ago', avatar: 'https://picsum.photos/seed/priya/100/100', unread: 2 },
                { name: 'NEXUS Support', msg: 'Your class booking has been confirmed!', time: '1d ago', avatar: 'https://picsum.photos/seed/support/100/100', unread: 0 },
              ].map((chat, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden">
                  <div className="relative">
                    <img src={chat.avatar} className="w-10 h-10 rounded-xl object-cover" alt={chat.name} />
                    {chat.unread > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#111118]">{chat.unread}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <div className="text-xs font-bold">{chat.name}</div>
                      <div className="text-[9px] text-gray-500 font-bold uppercase">{chat.time}</div>
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">{chat.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
