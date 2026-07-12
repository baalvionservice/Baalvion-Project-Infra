"use client"

import { useState, useEffect } from "react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  Users, 
  CreditCard, 
  Star, 
  Clock, 
  Calendar, 
  ArrowRight,
  MessageSquare,
  Search,
  Plus,
  Circle
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const INDIA_TEACHERS = [
  { name: "Rahul Patel", subject: "Physics", rating: 4.8, students: 10, classes: 187, earned: "$2,230", status: "active", next: "Today 3PM", avatar: "https://picsum.photos/seed/rahul/100/100" },
  { name: "Anita Singh", subject: "Chemistry", rating: 4.9, students: 10, classes: 210, earned: "$2,520", status: "active", next: "Today 5PM", avatar: "https://picsum.photos/seed/anita/100/100" },
  { name: "Vikram Kumar", subject: "Mathematics", rating: 4.7, students: 10, classes: 165, earned: "$1,980", status: "active", next: "Tomorrow 10AM", avatar: "https://picsum.photos/seed/vikram/100/100" },
  { name: "Deepa Nair", subject: "Coding", rating: 4.9, students: 10, classes: 234, earned: "$2,808", status: "live", next: "LIVE NOW", avatar: "https://picsum.photos/seed/deepa/100/100" },
  { name: "Arjun Sharma", subject: "Business", rating: 4.5, students: 8, classes: 89, earned: "$1,068", status: "inactive", next: "3 days ago", avatar: "https://picsum.photos/seed/arjun/100/100" },
];

export default function CountryDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">🇮🇳 India Command</h1>
          <p className="text-gray-500 font-medium">Country Admin • Priya Sharma</p>
        </div>
        <div className="flex gap-4">
          <NexusButton variant="outline" className="border-white/5 h-12">
            <Calendar className="w-4 h-4 mr-2" /> Full Schedule
          </NexusButton>
          <NexusButton className="bg-blue-600 hover:bg-blue-700 h-12 px-8 font-bold shadow-lg shadow-blue-500/20">
            📢 Country Broadcast
          </NexusButton>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Gross Revenue', val: '$18,420', sub: '↑ +$890 this week', icon: CreditCard, color: 'text-emerald-400' },
          { label: 'Active Students', val: '64', sub: '+3 new', icon: Users, color: 'text-blue-400' },
          { label: 'Classes Today', val: '12', sub: '5 Done • 7 To Go', icon: Calendar, color: 'text-purple-400' },
          { label: 'Country Rating', val: '4.8', sub: '↑ +0.1 pts', icon: Star, color: 'text-amber-400' },
        ].map((stat, i) => (
          <NexusCard key={i} variant="stats" className="p-6 bg-white/[0.02] border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div className="p-2.5 bg-white/5 rounded-xl">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div className="text-[10px] font-bold text-emerald-500">{stat.sub}</div>
            </div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white">{stat.val}</div>
          </NexusCard>
        ))}
      </div>

      {/* Teacher Management Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">India's Elite Teachers (7)</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input className="bg-white/5 border border-white/10 h-10 rounded-xl pl-10 pr-4 text-sm w-full" placeholder="Quick search..." />
          </div>
        </div>

        <div className="space-y-4">
          {INDIA_TEACHERS.map((teacher) => (
            <NexusCard key={teacher.name} className={cn("p-6 border-white/5 bg-white/[0.01] transition-all border-l-4", teacher.status === 'live' ? 'border-l-red-500 bg-red-500/[0.02]' : teacher.status === 'active' ? 'border-l-emerald-500' : 'border-l-gray-700 opacity-60')}>
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className="relative">
                    <img src={teacher.avatar} className="w-16 h-16 rounded-2xl object-cover border border-white/10" alt="avatar" />
                    <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black", teacher.status === 'live' ? 'bg-red-500 animate-pulse' : teacher.status === 'active' ? 'bg-emerald-500' : 'bg-gray-700')} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      {teacher.name}
                      {teacher.status === 'live' && <NexusBadge variant="live" className="text-[8px] py-0">LIVE NOW</NexusBadge>}
                    </h3>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{teacher.subject} • {teacher.rating}⭐</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-[2]">
                  <div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase mb-1 tracking-widest">Students</div>
                    <div className="font-bold text-sm">{teacher.students}/10</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase mb-1 tracking-widest">Classes</div>
                    <div className="font-bold text-sm">{teacher.classes}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase mb-1 tracking-widest">Revenue</div>
                    <div className="font-bold text-sm">{teacher.earned}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-gray-500 uppercase mb-1 tracking-widest">Next Class</div>
                    <div className={cn("font-bold text-sm", teacher.status === 'live' ? 'text-red-500' : 'text-white')}>{teacher.next}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <NexusButton variant="outline" className="h-10 px-4 text-[10px] uppercase font-bold border-white/10">Message</NexusButton>
                  <NexusButton variant="ghost" className="h-10 px-4 text-[10px] uppercase font-bold border border-white/5">Details</NexusButton>
                </div>
              </div>
            </NexusCard>
          ))}
        </div>
      </section>

      {/* Today's Timeline */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold">Class Timeline — Today</h2>
        <NexusCard className="p-8 border-white/5 bg-white/[0.02]">
          <div className="space-y-12 relative before:absolute before:left-[100px] before:top-4 before:bottom-4 before:w-px before:bg-white/10">
            {[
              { time: "09:00 AM", teacher: "Rahul Patel", subject: "Physics — Mechanics", status: "completed" },
              { time: "11:00 AM", teacher: "Deepa Nair", subject: "Coding — Python", status: "completed" },
              { time: "03:00 PM", teacher: "Deepa Nair", subject: "Coding — React Advanced", status: "live" },
              { time: "04:00 PM", teacher: "Rahul Patel", subject: "Physics — Optics", status: "upcoming" },
            ].map((item, i) => (
              <div key={i} className="flex gap-12 group">
                <div className="w-[100px] text-right font-mono text-sm text-gray-500 font-bold pt-1">{item.time}</div>
                <div className="relative flex-1">
                  <div className={cn("absolute -left-[53px] top-2 w-2.5 h-2.5 rounded-full border-2 border-black", item.status === 'live' ? 'bg-red-500 animate-pulse' : item.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-700')} />
                  <div className={cn("p-5 rounded-2xl border transition-all", item.status === 'live' ? 'border-red-500/30 bg-red-500/5' : 'border-white/5 bg-white/5')}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.subject}</div>
                        <div className="font-bold">{item.teacher}</div>
                      </div>
                      <div className="text-[10px] font-bold uppercase">{item.status}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </NexusCard>
      </section>
    </div>
  )
}