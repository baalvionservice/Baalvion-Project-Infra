"use client"

import { useState } from "react"
import { 
  Search, 
  Filter, 
  Download, 
  UserPlus, 
  MoreVertical, 
  Eye, 
  Edit, 
  ShieldBan,
  Mail,
  Wallet,
  ArrowUpRight
} from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const MOCK_USERS = Array.from({ length: 20 }).map((_, i) => ({
  id: `USR-${1000 + i}`,
  name: i % 2 === 0 ? "Yuki Tanaka" : "Aryan Mehta",
  role: i % 2 === 0 ? "Teacher" : "Student",
  region: i % 2 === 0 ? "East Asia 🌏" : "South Asia 🌿",
  status: "Active",
  joined: "Jan 2024",
  revenue: i % 2 === 0 ? "$8,420" : "$680",
  balance: "0.842 ETH",
  avatar: `https://picsum.photos/seed/user${i}/100/100`
}));

export default function UserManagementPage() {
  return (
    <div className="p-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">User Registry</h1>
          <p className="text-gray-500 font-medium">Manage and audit the 3,773 global platform members.</p>
        </div>
        <div className="flex items-center gap-4">
          <NexusButton variant="outline" className="border-white/5 h-12 px-6 text-gray-400 font-bold">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </NexusButton>
          <NexusButton className="bg-red-600 hover:bg-red-700 h-12 px-8 font-bold">
            <UserPlus className="w-4 h-4 mr-2" /> Provision User
          </NexusButton>
        </div>
      </header>

      <NexusCard className="p-8 bg-white/[0.02] border-white/5 space-y-8">
        <div className="flex flex-col lg:flex-row items-center gap-6 justify-between">
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            {['All Users', 'Teachers', 'Students', 'Banned'].map(t => (
              <button key={t} className={cn("px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", t === 'All Users' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white')}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input 
                type="text" 
                placeholder="Search by name, email, node ID..." 
                className="bg-black/40 border border-white/10 h-12 rounded-xl pl-12 pr-4 text-sm text-white w-full outline-none focus:border-red-500/50 transition-all"
              />
            </div>
            <NexusButton variant="outline" className="h-12 border-white/5 text-gray-500">
              <Filter className="w-4 h-4" />
            </NexusButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="p-6 w-12"><Checkbox /></th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">User / Role</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Region</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Wallet</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Revenue/Spent</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group cursor-pointer">
                  <td className="p-6"><Checkbox /></td>
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" alt="avatar" />
                      <div>
                        <div className="font-bold text-white group-hover:text-red-400 transition-colors">{user.name}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center text-sm font-medium text-gray-400">{user.region}</td>
                  <td className="p-6 text-center">
                    <NexusBadge variant="success" className="bg-emerald-500/10 text-emerald-400 border-none px-4">Active</NexusBadge>
                  </td>
                  <td className="p-6 text-right">
                    <div className="text-sm font-bold text-white">{user.balance}</div>
                    <div className="text-[9px] text-gray-500 font-mono tracking-tighter truncate max-w-[80px] ml-auto">0x4f2a...8b3c</div>
                  </td>
                  <td className="p-6 text-right font-bold text-white">{user.revenue}</td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-gray-600 hover:text-white transition-colors"><Mail className="w-4 h-4" /></button>
                      <button className="p-2 text-gray-600 hover:text-white transition-colors"><Edit className="w-4 h-4" /></button>
                      <button className="p-2 text-gray-600 hover:text-red-500 transition-colors"><ShieldBan className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-8 border-t border-white/5 flex items-center justify-between">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Showing 20 of 3,773 global users</div>
          <div className="flex gap-2">
            <NexusButton variant="outline" size="sm" className="h-10 px-6 border-white/5 text-gray-500" disabled>Previous</NexusButton>
            <NexusButton variant="outline" size="sm" className="h-10 px-6 border-white/5 text-gray-500 hover:text-white">Next Page</NexusButton>
          </div>
        </div>
      </NexusCard>
    </div>
  );
}