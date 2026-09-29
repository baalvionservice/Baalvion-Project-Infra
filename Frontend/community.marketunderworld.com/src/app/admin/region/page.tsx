"use client"

import { useState, useEffect } from "react"
import { COUNTRIES_DATA } from "@/lib/mock-data"
import { ListingCard, Badge } from "@/components/ui/ListingCard"
import { AppButton } from "@/components/ui/AppButton"
import { 
  Globe, 
  Users, 
  CreditCard, 
  MessageSquare, 
  ChevronRight,
  Calendar,
} from "lucide-react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function RegionDashboard() {
  const [mounted, setMounted] = useState(false);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    // Stable mock data generation
    setRevenueData(Array.from({ length: 30 }).map((_, i) => ({
      name: `Day ${i + 1}`,
      india: 1000 + Math.random() * 500,
      pakistan: 500 + Math.random() * 300,
      bangladesh: 300 + Math.random() * 200,
    })));
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 uppercase font-display">🌿 South Asia Region</h1>
          <p className="text-text-muted font-medium uppercase tracking-widest text-xs">Regional Command Center · Raj Patel</p>
        </div>
        <div className="flex gap-4">
          <AppButton variant="secondary" className="h-12 px-6">
            <MessageSquare className="w-4 h-4 mr-2" /> Message Teachers
          </AppButton>
          <AppButton className="h-12 px-8 font-bold">
            📢 Region Announcement
          </AppButton>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Countries', val: '7', icon: Globe, color: 'text-brand-green' },
          { label: 'Teachers', val: '49', icon: Users, color: 'text-semantic-crypto' },
          { label: 'Students', val: '490', icon: Users, color: 'text-semantic-info' },
          { label: 'Revenue', val: '$38,760', icon: CreditCard, color: 'text-brand-green' },
          { label: 'Classes', val: '34', icon: Calendar, color: 'text-semantic-info' },
          { label: 'Forum', val: '12.4k', icon: MessageSquare, color: 'text-semantic-info' },
        ].map((stat, i) => (
          <ListingCard key={i} className="p-5 flex flex-col justify-between h-32 hover:border-brand-green">
            <div className="flex justify-between items-start">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
              <div className="text-[10px] font-bold text-brand-green font-mono">↑ 12%</div>
            </div>
            <div>
              <div className="text-xl font-bold text-text-primary font-mono">{stat.val}</div>
              <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            </div>
          </ListingCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Country Grid */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold uppercase font-display">Regional Nodes</h2>
            <AppButton variant="ghost" size="sm" className="text-brand-green font-bold">View List View</AppButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COUNTRIES_DATA.map((country) => (
              <ListingCard key={country.id} className="p-6 group hover:border-brand-green transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{country.flag}</span>
                    <div>
                      <h3 className="text-xl font-bold">{country.name}</h3>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Admin: {country.admin}</p>
                    </div>
                  </div>
                  <Badge variant="success" className="px-4">Active</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-brand-elevated p-3 rounded-md border border-brand-border">
                    <div className="text-[9px] font-bold text-text-muted uppercase mb-1 tracking-widest">Teachers</div>
                    <div className="font-bold font-mono">{country.teachers}</div>
                  </div>
                  <div className="bg-brand-elevated p-3 rounded-md border border-brand-border">
                    <div className="text-[9px] font-bold text-text-muted uppercase mb-1 tracking-widest">Revenue</div>
                    <div className="font-bold font-mono">${country.revenue.toLocaleString()}</div>
                  </div>
                </div>
                <AppButton className="w-full h-10 border-brand-border text-[10px] font-bold group-hover:bg-brand-green group-hover:text-black transition-all" variant="secondary">
                  Manage Node <ChevronRight className="w-3 h-3 ml-2" />
                </AppButton>
              </ListingCard>
            ))}
          </div>
        </div>

        {/* Right Analytics */}
        <div className="lg:col-span-4 space-y-8">
          <h2 className="text-2xl font-bold uppercase font-display">Revenue Growth</h2>
          <ListingCard className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorIndia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39FF14" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#39FF14" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <Tooltip contentStyle={{ backgroundColor: '#111318', border: '1px solid #252A33', fontFamily: 'JetBrains Mono' }} />
                <Area type="monotone" dataKey="india" stroke="#39FF14" fillOpacity={1} fill="url(#colorIndia)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ListingCard>

          <ListingCard className="p-8 space-y-6">
            <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-text-muted">High-Demand Subjects</h3>
            <div className="space-y-4">
              {[
                { name: 'Chemistry', teachers: 8, rev: '$12,340', val: 90 },
                { name: 'Physics', teachers: 7, rev: '$9,870', val: 75 },
                { name: 'Mathematics', teachers: 6, rev: '$8,230', val: 65 },
              ].map((sub) => (
                <div key={sub.name}>
                  <div className="flex justify-between text-[11px] font-bold mb-2 font-mono uppercase tracking-widest">
                    <span className="text-text-muted">{sub.name}</span>
                    <span className="text-text-primary">{sub.rev}</span>
                  </div>
                  <div className="h-1 bg-brand-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-brand-green" style={{ width: `${sub.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </ListingCard>
        </div>
      </div>
    </div>
  )
}
