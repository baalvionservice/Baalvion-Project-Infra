"use client"

import React from 'react';
import { 
  Zap, 
  Users, 
  CreditCard, 
  MessageSquare, 
  Plus, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';

import { cn } from '@/lib/utils';
import { STATS } from '@/data/mockData';

export default function TeacherDashboard() {
  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Teacher Terminal</h1>
          <p className="text-text-muted font-medium text-lg uppercase tracking-widest text-xs">Operator: Priya Sharma • Access Level 3</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="h-12 px-8 font-bold">
            <Zap className="w-4 h-4 mr-2" /> Start Live Session
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'My Students', val: '1,240', icon: Users, color: 'text-semantic-info' },
          { label: 'Total Revenue', val: '12.4 ETH', icon: CreditCard, color: 'text-brand-green' },
          { label: 'Marketplace Sales', val: '842', icon: Zap, color: 'text-semantic-warning' },
          { label: 'Unread Messages', val: '18', icon: MessageSquare, color: 'text-purple-400' },
        ].map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <ArrowUpRight className="w-4 h-4 text-text-muted" />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stat.val}</div>
          </ListingCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ListingCard className="lg:col-span-8 p-10 border-brand-border bg-brand-surface">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-10">Revenue Growth</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={STATS.revenueData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39FF14" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#39FF14" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F232B" vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111318', border: '1px solid #252A33', borderRadius: '4px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#39FF14" strokeWidth={3} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ListingCard>

        <ListingCard className="lg:col-span-4 p-10 space-y-8 border-brand-border bg-brand-surface">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Secret Codes</h3>
          <div className="space-y-4">
            {[
              { code: 'SECRET70', discount: '70%', status: 'Active' },
              { code: 'MU10', discount: '10%', status: 'Active' },
            ].map(code => (
              <div key={code.code} className="p-4 bg-brand-void rounded border border-brand-border flex justify-between items-center group hover:border-brand-green transition-all">
                <div>
                  <div className="font-mono font-bold text-white text-sm">{code.code}</div>
                  <div className="text-[10px] text-text-muted uppercase font-bold">{code.discount} OFF</div>
                </div>
                <Badge variant="success">{code.status}</Badge>
              </div>
            ))}
            <AppButton variant="secondary" className="w-full border-dashed border-brand-border h-12">
              <Plus className="w-4 h-4 mr-2" /> New Secret Code
            </AppButton>
          </div>
        </ListingCard>
      </div>
    </div>
  );
}
