"use client"

import React, { useState, useEffect } from 'react';
import { TEACHERS } from '@/lib/mock-data';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Search, GraduationCap, Star, Users, ShieldCheck, MoreVertical, Ban, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TeacherNetworkPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Teacher Network</h1>
          <p className="text-text-muted font-medium">Manage and audit the elite operator nodes.</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="bg-brand-green text-black px-8 h-12 font-bold uppercase text-[11px] tracking-widest">
            Approve Requests (12)
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Teachers', val: '500', icon: GraduationCap, color: 'text-brand-green' },
          { label: 'Active Today', val: '343', icon: ShieldCheck, color: 'text-semantic-info' },
          { label: 'Network Rating', val: '4.9', icon: Star, color: 'text-semantic-warning' },
          { label: 'Total Students', val: '30,000', icon: Users, color: 'text-white' },
        ].map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stat.val}</div>
          </ListingCard>
        ))}
      </div>

      <ListingCard className="p-0 overflow-hidden border-brand-border bg-brand-surface">
        <div className="p-6 border-b border-brand-border bg-brand-void/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost" />
            <input 
              placeholder="Search operators..." 
              className="w-full bg-brand-void border border-brand-border h-11 rounded-lg pl-11 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Active', 'Pending', 'Suspended'].map(tab => (
              <button key={tab} className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white hover:bg-white/10 transition-all">
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead className="bg-brand-void/80 text-[10px] text-text-muted uppercase tracking-widest">
              <tr>
                <th className="p-6">Operator Identity</th>
                <th className="p-6">Node Segment</th>
                <th className="p-6">Efficiency</th>
                <th className="p-6">Total Students</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-brand-border/50">
              {TEACHERS.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-brand-void/30 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-brand-border">
                        <img src={teacher.avatar_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-brand-green transition-colors">{teacher.name}</div>
                        <div className="text-[10px] text-text-muted">{teacher.subject}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-white">{teacher.region}</div>
                    <div className="text-[10px] text-text-ghost">{teacher.country}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-1 text-semantic-warning">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="font-bold">{teacher.rating}</span>
                    </div>
                  </td>
                  <td className="p-6 text-white font-bold">{(teacher.students_count ?? 0).toLocaleString()}</td>
                  <td className="p-6">
                    <Badge variant="success">ACTIVE</Badge>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-text-ghost hover:text-white transition-colors" title="Audit"><ShieldCheck className="w-4 h-4" /></button>
                      <button className="p-2 text-text-ghost hover:text-semantic-error transition-colors" title="Suspend"><Ban className="w-4 h-4" /></button>
                      <button className="p-2 text-text-ghost hover:text-white transition-colors"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ListingCard>
    </div>
  );
}
