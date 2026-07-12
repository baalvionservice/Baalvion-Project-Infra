
"use client"

import { useState, useEffect } from "react"
import { 
  ShoppingBag, 
  TrendingUp, 
  Package, 
  CreditCard, 
  Star, 
  Clock, 
  ArrowUpRight,
  ChevronRight,
  Plus,
  RefreshCcw,
  Boxes
} from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const REVENUE_DATA = [
  { name: 'Mon', sales: 420 },
  { name: 'Tue', sales: 380 },
  { name: 'Wed', sales: 650 },
  { name: 'Thu', sales: 780 },
  { name: 'Fri', sales: 580 },
  { name: 'Sat', sales: 840 },
  { name: 'Sun', sales: 720 },
];

export default function SellerDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Store Command</h1>
          <p className="text-gray-500 font-medium text-lg">Managing TechGadgets Global Infrastructure.</p>
        </div>
        <div className="flex items-center gap-4">
          <NexusButton variant="outline" className="border-white/5 text-gray-400 font-bold h-12">
            <RefreshCcw className="w-4 h-4 mr-2" /> Sync Inventory
          </NexusButton>
          <NexusButton className="bg-emerald-600 hover:bg-emerald-500 h-12 px-8 font-bold shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4 mr-2" /> New Product
          </NexusButton>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Sales', val: '1,247', sub: '↑ +34 this month', icon: ShoppingBag, color: 'text-emerald-400' },
          { label: 'Total Revenue', val: '4.28 ETH', sub: '≈ $12,412.00', icon: CreditCard, color: 'text-blue-400' },
          { label: 'Active Products', val: '47', sub: '42 active • 5 draft', icon: Boxes, color: 'text-purple-400' },
          { label: 'Store Rating', val: '4.8', sub: 'Based on 234 reviews', icon: Star, color: 'text-amber-400' },
        ].map((stat, i) => (
          <NexusCard key={i} variant="stats" className="bg-white/[0.02] border-white/5 p-8 group hover:border-emerald-500/20 transition-all h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="p-4 rounded-2xl bg-white/5 text-gray-400 group-hover:text-emerald-400 transition-colors">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-lg">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12.4%
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-3xl font-bold text-white mb-1">{stat.val}</div>
              <div className="text-xs text-gray-500 font-medium">{stat.sub}</div>
            </div>
          </NexusCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <NexusCard className="lg:col-span-2 p-10 bg-white/[0.02] border-white/5">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-1">Sales Analytics</h3>
              <p className="text-sm text-gray-500">Daily revenue performance across all items.</p>
            </div>
            <div className="flex gap-2">
              {['7D', '30D', '1Y'].map(t => (
                <button key={t} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold transition-all", t === '7D' ? "bg-emerald-600 text-white shadow-lg" : "bg-white/5 text-gray-500 hover:text-white")}>{t}</button>
              ))}
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#070710', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </NexusCard>

        <div className="space-y-8">
          <NexusCard className="p-8 bg-white/[0.02] border-white/5">
            <h3 className="text-xl font-bold mb-8">Pending Orders (8)</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-white">#NX-8472-0{i}</div>
                    <NexusBadge variant="success" className="bg-emerald-500/10 text-emerald-400 border-none text-[8px]">NEW</NexusBadge>
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-4">iPhone 16 Pro — Titanium</div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-bold text-white">1,200 USDT</div>
                    <NexusButton variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold border border-white/10">Process</NexusButton>
                  </div>
                </div>
              ))}
              <NexusButton variant="outline" className="w-full border-dashed border-white/10 h-12 text-gray-500 font-bold text-[10px] uppercase">View All Orders</NexusButton>
            </div>
          </NexusCard>

          <NexusCard className="p-8 bg-amber-500/5 border border-amber-500/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto animate-pulse">
              <Star className="w-6 h-6 fill-amber-500" />
            </div>
            <h4 className="font-bold text-amber-500">Elite Performance</h4>
            <p className="text-[10px] text-gray-500 font-medium">Your shipping speed is in the top 5% of marketplace sellers. Badge active for 12 more days.</p>
          </NexusCard>
        </div>
      </div>
    </div>
  )
}
