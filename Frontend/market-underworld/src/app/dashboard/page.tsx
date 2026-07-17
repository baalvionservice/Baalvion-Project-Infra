"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Globe, MessageSquare, Search, TrendingUp, Users, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const MOCK_FORUMS = [
  {
    region: 'Europe & Central Asia',
    countries: [
      { name: 'Germany', topics: 124, threads: 842 },
      { name: 'France', topics: 98, threads: 654 },
      { name: 'Poland', topics: 45, threads: 231 }
    ]
  },
  {
    region: 'South Asia',
    countries: [
      { name: 'India', topics: 342, threads: 2105 },
      { name: 'Bangladesh', topics: 87, threads: 432 },
      { name: 'Sri Lanka', topics: 56, threads: 198 }
    ]
  },
  {
    region: 'North America',
    countries: [
      { name: 'United States', topics: 512, threads: 4521 },
      { name: 'Canada', topics: 156, threads: 1204 }
    ]
  }
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#070710] text-foreground">
      {/* Top Navigation */}
      <nav className="border-b border-border/50 bg-[#0A0A0F]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl tracking-tighter">UNDERWORLD FORUM</span>
          </div>
          
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search intelligence nodes..." className="pl-10 bg-background/50 border-border/50" />
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Marketplace</a>
            <a href="#" className="hover:text-primary transition-colors">Research</a>
            <a href="#" className="hover:text-primary transition-colors">Network</a>
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary text-xs font-bold">
              AM
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 hidden lg:block border-r border-border/50 min-h-[calc(100vh-64px)] p-6 space-y-8">
          <div>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Intelligence Hub</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 text-primary font-medium cursor-pointer">
                <Globe className="w-4 h-4" /> Global Feed
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <Users className="w-4 h-4" /> Community
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <MessageSquare className="w-4 h-4" /> Private Comms
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Active Sectors</h3>
            <div className="space-y-2">
              <div className="text-sm hover:text-primary cursor-pointer transition-colors">Tech Arbitrage</div>
              <div className="text-sm hover:text-primary cursor-pointer transition-colors">Digital Logistics</div>
              <div className="text-sm hover:text-primary cursor-pointer transition-colors">Knowledge Assets</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Regional Intelligence Boards</h1>
            <p className="text-muted-foreground">Select a sector node to view local threads and market discussions.</p>
          </div>

          <div className="space-y-12">
            {MOCK_FORUMS.map((section, idx) => (
              <motion.section 
                key={section.region}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight">{section.region}</h2>
                  <div className="h-px flex-1 bg-border/50 ml-4" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {section.countries.map((country) => (
                    <Card key={country.name} className="p-6 bg-[#0A0A0F]/50 border-border/50 hover:border-primary/50 transition-all group cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{country.name}</h3>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </div>
                      <div className="flex gap-6">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Topics</p>
                          <p className="text-lg font-mono">{country.topics}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Threads</p>
                          <p className="text-lg font-mono">{country.threads}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}