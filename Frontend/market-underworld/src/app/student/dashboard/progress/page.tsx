"use client"

import { useState, useEffect } from "react"
import { SUBJECT_PROGRESS } from "@/lib/mock-student-data"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { 
  BarChart3, 
  Clock, 
  BookOpen, 
  Star, 
  Trophy, 
  Target,
  ArrowUpRight,
  TrendingUp,
  Map as MapIcon
} from "lucide-react"
import { motion } from "framer-motion"

const MONTHLY_DATA = [
  { name: 'Jan', hours: 12 },
  { name: 'Feb', hours: 18 },
  { name: 'Mar', hours: 26 },
  { name: 'Apr', hours: 22 },
  { name: 'May', hours: 34 },
  { name: 'Jun', hours: 42 },
];

const PIE_DATA = [
  { name: 'Mathematics', value: 45, color: '#3b82f6' },
  { name: 'Chemistry', value: 25, color: '#10b981' },
  { name: 'Physics', value: 18, color: '#f59e0b' },
  { name: 'Data Science', value: 12, color: '#8b5cf6' },
];

export default function ProgressPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-3 text-blue-400 font-bold text-sm uppercase tracking-widest mb-4">
          <BarChart3 className="w-4 h-4" /> Performance Metrics
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Learning Progress & Reports</h1>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {[
          { label: 'Total Classes', val: '24', icon: BookOpen },
          { label: 'Total Hours', val: '36.5', icon: Clock },
          { label: 'Avg Rating', val: '5.0', icon: Star },
          { label: 'Subjects', val: '4', icon: Target },
          { label: 'Streak', val: '12', icon: Trophy },
          { label: 'Total Spent', val: '0.45 ETH', icon: TrendingUp },
        ].map((stat, i) => (
          <NexusCard key={i} className="p-4 bg-white/[0.02] border-white/5 flex flex-col items-center justify-center text-center">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg mb-3">
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold mb-1">{stat.val}</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
          </NexusCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
        {/* Main Growth Chart */}
        <NexusCard className="lg:col-span-2 p-8 border-white/5 bg-white/[0.02]">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-bold text-lg mb-1">Learning Hours Over Time</h3>
              <p className="text-xs text-gray-500">Monthly study activity and engagement growth.</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">+24%</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase">Growth vs Q4</div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_DATA}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#6b7280" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </NexusCard>

        {/* Subject Breakdown */}
        <NexusCard className="p-8 border-white/5 bg-white/[0.02]">
          <h3 className="font-bold text-lg mb-10">Subject Distribution</h3>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-[10px] text-gray-500 font-bold uppercase">Total</div>
                <div className="text-xl font-bold">100%</div>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {PIE_DATA.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400">{item.name}</span>
                </div>
                <span className="text-xs font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </NexusCard>
      </div>

      {/* Study Heatmap (Simplified) */}
      <section className="mb-12">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
          <MapIcon className="w-5 h-5 text-emerald-500" /> Learning Consistency
        </h3>
        <NexusCard className="p-8 border-white/5 bg-white/[0.02]">
           <div className="flex flex-wrap gap-2">
             {Array.from({ length: 91 }).map((_, i) => {
               const intensity = Math.random();
               const bgColor = intensity > 0.8 ? 'bg-blue-500' : intensity > 0.5 ? 'bg-blue-500/60' : intensity > 0.2 ? 'bg-blue-500/20' : 'bg-white/5';
               return (
                 <div key={i} className={`w-3 h-3 rounded-[2px] ${bgColor} transition-all hover:ring-2 hover:ring-white/20 cursor-pointer`} title={`Day ${i + 1}: ${Math.floor(intensity * 4)} hours`} />
               )
             })}
           </div>
           <div className="mt-6 flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">
             <span>Last 3 Months</span>
             <div className="flex items-center gap-2">
               <span>Less</span>
               <div className="flex gap-1">
                 <div className="w-2.5 h-2.5 rounded-[1px] bg-white/5" />
                 <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-500/20" />
                 <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-500/60" />
                 <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-500" />
               </div>
               <span>More</span>
             </div>
           </div>
        </NexusCard>
      </section>

      {/* Detailed Table */}
      <section>
        <h3 className="text-xl font-bold mb-8">Teacher Feedback Loop</h3>
        <NexusCard className="p-0 border-white/5 bg-white/[0.02] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Teacher</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subject</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Rating Given</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Note</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: 'Priya Sharma', subject: 'Calculus', rating: 5, note: 'Amazing clarity and deep technical insight.' },
                { name: 'Rahul Patel', subject: 'Physics', rating: 5, note: 'Very patient with foundational concepts.' },
                { name: 'Emily Chen', subject: 'Data Science', rating: 4, note: 'Great pace, but could use more homework.' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-6 text-sm font-bold">{row.name}</td>
                  <td className="p-6 text-sm text-gray-500">{row.subject}</td>
                  <td className="p-6">
                    <div className="flex justify-center gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`w-3 h-3 ${j < row.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="p-6 text-xs text-gray-500 italic max-w-xs truncate">"{row.note}"</td>
                  <td className="p-6 text-right">
                    <NexusButton variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold border border-white/5">Details</NexusButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </NexusCard>
      </section>
    </div>
  )
}
