"use client"

import React from 'react';
import { MOCK_USERS } from '@/data/mockData';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Search, Users, ShieldCheck, Mail, ShieldBan, MoreVertical, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UserManagementPage() {
  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">User Registry</h1>
          <p className="text-text-muted font-medium">Manage and audit the 50,000 global platform members.</p>
        </div>
        <div className="flex gap-4">
          <AppButton className="bg-brand-green text-black px-8 h-12 font-bold uppercase text-[11px] tracking-widest">
            Export CSV
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Users', val: '50,000', icon: Users, color: 'text-brand-green' },
          { label: 'Verified Status', val: '92%', icon: ShieldCheck, color: 'text-semantic-info' },
          { label: 'Suspended Nodes', val: '124', icon: ShieldBan, color: 'text-semantic-error' },
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
              placeholder="Search by identity email, role, node ID..." 
              className="w-full bg-brand-void border border-brand-border h-11 rounded-lg pl-11 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead className="bg-brand-void/80 text-[10px] text-text-muted uppercase tracking-widest">
              <tr>
                <th className="p-6">Identity</th>
                <th className="p-6">Role</th>
                <th className="p-6">Node Segment</th>
                <th className="p-6">Registry Date</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-brand-border/50 text-white">
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="hover:bg-brand-void/30 transition-colors group">
                  <td className="p-6">
                    <div>
                      <div className="font-bold group-hover:text-brand-green transition-colors">{user.name}</div>
                      <div className="text-[10px] text-text-muted">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-6">
                    <Badge variant={user.role === 'SUPER_ADMIN' ? 'warning' : 'default'} className="text-[8px]">{user.role}</Badge>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-brand-green" />
                      <span>{user.country}</span>
                    </div>
                  </td>
                  <td className="p-6 text-text-muted">{user.joinedDate}</td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-text-ghost hover:text-white"><Mail className="w-4 h-4" /></button>
                      <button className="p-2 text-text-ghost hover:text-semantic-error"><ShieldBan className="w-4 h-4" /></button>
                      <button className="p-2 text-text-ghost hover:text-white"><MoreVertical className="w-4 h-4" /></button>
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