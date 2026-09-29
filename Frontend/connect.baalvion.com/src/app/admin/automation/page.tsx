
'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Settings, 
  ShieldCheck, 
  RefreshCcw, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  History,
  Info
} from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function AutomationManagerPage() {
  const { rules, fetchRules, triggerEvent, loading } = useNotificationStore();

  useEffect(() => {
    fetchRules();
  }, []);

  const handleTestTrigger = () => {
    triggerEvent('proposal.sent', { companyName: 'Test Brand', userId: 'mock_user' });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            Workflow Automation
          </h1>
          <p className="text-slate-500 font-medium">Define event-driven logic and platform communication rules.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200" onClick={handleTestTrigger}>
            <Activity className="mr-2 h-4 w-4" /> Test Pipeline
          </Button>
          <Button className="rounded-xl font-black shadow-xl shadow-primary/20 h-11 px-6">
            <Settings className="mr-2 h-4 w-4" /> Global Logic Config
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Rules List */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl">Active Automation Rules</CardTitle>
              <CardDescription>Event-Action pairs currently active in the marketplace.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 h-16">
                    <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Trigger Event</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">System Action</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Control</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-20">
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                            <Activity className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-slate-900">{rule.event}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 font-bold border-slate-200">
                            {rule.action}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase border-none",
                          rule.enabled ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                        )}>
                          {rule.enabled ? 'Enabled' : 'Paused'}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Switch checked={rule.enabled} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Insights */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Zap className="h-16 w-16" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Event Reliability</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Automation events are dispatched via internal worker queues. Delivery success rate is currently **99.98%**.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Pipeline Healthy
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <History className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">Automation History</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Every triggered action is recorded in the immutable audit ledger for compliance.
              </p>
            </div>
            <Button variant="link" className="text-xs font-bold text-primary h-auto p-0">View Logs</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
