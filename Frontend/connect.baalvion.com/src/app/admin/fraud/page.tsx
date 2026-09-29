'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Activity, 
  RefreshCcw, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  FileText, 
  AlertTriangle, 
  History, 
  TrendingUp, 
  Fingerprint 
} from 'lucide-react';
import { FraudAlerts } from '@/components/admin/FraudAlerts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function FraudDetectionDashboard() {
  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" />
            Fraud & Integrity Shield
          </h1>
          <p className="text-slate-500 font-medium">Real-time marketplace heuristic monitoring and bot-activity detection.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl font-bold bg-white h-11 border-slate-200"
          >
            <History className="mr-2 h-4 w-4" /> Incident History
          </Button>
          <Button className="rounded-xl font-black shadow-xl shadow-primary/20 h-11 px-6">
            <RefreshCcw className="mr-2 h-4 w-4" /> Retrain Models
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Alerts', value: '12', trend: '3 high risk', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Integrity Score', value: '98.2%', trend: '+0.4%', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'IP Collisions', value: '4', trend: 'Last 24h', icon: Fingerprint, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'System Health', value: 'Normal', trend: '12ms Latency', icon: Activity, color: 'text-primary', bg: 'bg-primary/5' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm rounded-2xl p-6 bg-white group hover:shadow-md transition-shadow">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black mt-1 text-slate-900">{stat.value}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{stat.trend}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Alert Feed */}
        <div className="lg:col-span-9 space-y-8">
          <FraudAlerts />
        </div>

        {/* Sidebar Insights */}
        <aside className="lg:col-span-3 space-y-8">
          
          {/* Security Digest */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-slate-900 text-white">
            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Heuristic Pulse</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[
                { label: 'Bot Traffic', status: 'LOW', color: 'text-emerald-400' },
                { label: 'Duplicate Users', status: 'STABLE', color: 'text-slate-400' },
                { label: 'Payout Velocity', status: 'HIGH', color: 'text-orange-400' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-500 uppercase tracking-widest">{item.label}</span>
                    <span className={item.color}>{item.status}</span>
                  </div>
                  <Separator className="bg-white/5" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Infrastructure Health */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Protection Layers</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { title: 'IP Geo-Fencing', active: true },
                { title: 'Payout Escrow', active: true },
                { title: 'Behavioral AI', active: true },
                { title: 'VPN Detection', active: false },
              ].map((layer, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">{layer.title}</span>
                  {layer.active ? (
                    <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] h-4">ACTIVE</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[8px] h-4 font-black">OFF</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Audit Protocol */}
          <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">Tamper-Proof Logging</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Every action taken in this dashboard is recorded in the immutable audit ledger for compliance.
              </p>
            </div>
            <Button variant="link" className="text-xs font-bold text-primary h-auto p-0 group">
              View Audit Trail <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

        </aside>
      </div>
    </div>
  );
}