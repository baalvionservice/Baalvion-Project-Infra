
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  Filter, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  RefreshCcw, 
  ArrowUpRight, 
  ChevronRight,
  UserCheck,
  ShieldAlert,
  Loader2,
  FileText,
  Clock,
  Settings,
  MoreVertical,
  Sliders,
  History
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock Data for Charts
const MATCH_SCORE_DISTRIBUTION = [
  { range: '0-20%', count: 120 },
  { range: '21-40%', count: 450 },
  { range: '41-60%', count: 1200 },
  { range: '61-80%', count: 2800 },
  { range: '81-100%', count: 1500 },
];

const AUTHENTICITY_DATA = [
  { name: 'Mon', score: 92 },
  { name: 'Tue', score: 91 },
  { name: 'Wed', score: 94 },
  { name: 'Thu', score: 89 },
  { name: 'Fri', score: 92 },
  { name: 'Sat', score: 95 },
  { name: 'Sun', score: 96 },
];

const NICHE_MATCH_QUALITY = [
  { niche: 'Tech', avg: 92, count: 1200 },
  { niche: 'Fashion', avg: 85, count: 850 },
  { niche: 'Gaming', avg: 94, count: 600 },
  { niche: 'Travel', avg: 88, count: 450 },
  { niche: 'Food', avg: 82, count: 300 },
];

const AI_AUDIT_LOG = [
  { id: 'log_1', event: 'Match Prediction', target: 'Campaign #492', result: '98% Match', status: 'SUCCESS', time: '2m ago' },
  { id: 'log_2', event: 'Authenticity Scan', target: '@sarah_tech', result: '94% Score', status: 'SUCCESS', time: '12m ago' },
  { id: 'log_3', event: 'Risk Detection', target: 'Deliverable #102', result: 'Flagged (0.82)', status: 'ALERT', time: '45m ago' },
  { id: 'log_4', event: 'Niche Analysis', target: 'Marketplace', result: 'Retrained', status: 'SUCCESS', time: '2h ago' },
];

export default function AIMonitoringDashboard() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [newScore, setNewScore] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = [
    { label: 'Avg Match Accuracy', value: '94.2%', trend: '+1.2%', icon: Sparkles, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Prediction Latency', value: '142ms', trend: '-12ms', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Daily Predictions', value: '42.5k', trend: '+15%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Models', value: '14', trend: 'Healthy', icon: Cpu, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: "Model Metrics Refreshed", description: "Real-time AI performance data updated." });
    }, 1500);
  };

  const handleOverride = async () => {
    if (!selectedCreator || !newScore || !overrideReason) return;
    setIsSubmitting(true);
    
    // Simulate Firestore update
    setTimeout(() => {
      setIsSubmitting(false);
      setIsOverrideOpen(false);
      toast({ 
        title: "Manual Override Applied", 
        description: `Authenticity score for @${selectedCreator.handle} set to ${newScore}%.` 
      });
      setNewScore('');
      setOverrideReason('');
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Cpu className="h-8 w-8 text-primary" />
            AI Performance & Monitoring
          </h1>
          <p className="text-slate-500 font-medium">Marketplace matching metrics, authenticity auditing, and model governance.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl font-bold bg-white h-11 border-slate-200"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refresh Metrics
          </Button>
          <Button className="rounded-xl font-black shadow-xl shadow-primary/20 h-11 px-6">
            <Sliders className="mr-2 h-4 w-4" /> Model Configuration
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
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
        
        {/* Distribution Charts */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Match Score Distribution */}
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Match Score Distribution</CardTitle>
                <CardDescription>Volume of predicted creator-brand pairings by score range.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary font-black text-[10px] uppercase">Peak: 61-80%</Badge>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MATCH_SCORE_DISTRIBUTION}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="range" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                      cursor={{fill: '#f8fafc'}}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {MATCH_SCORE_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 3 ? '#6C3AE8' : '#e2e8f0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Authenticity Over Time */}
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl">Network Authenticity Audit</CardTitle>
              <CardDescription>Average verification confidence across the entire creator network.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={AUTHENTICITY_DATA}>
                    <defs>
                      <linearGradient id="colorAuth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                      domain={[80, 100]}
                    />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#10B981" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorAuth)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls & Audit */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* AI Decision Audit Log */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Decision Audit Log
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-300">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {AI_AUDIT_LOG.map((log) => (
                  <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      log.status === 'ALERT' ? "bg-red-50 text-red-600" : "bg-primary/5 text-primary"
                    )}>
                      {log.status === 'ALERT' ? <ShieldAlert className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-xs font-black text-slate-900 uppercase truncate">{log.event}</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{log.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate">Target: {log.target}</p>
                      <p className={cn("text-[10px] font-black uppercase mt-1", log.status === 'ALERT' ? "text-red-600" : "text-emerald-600")}>
                        {log.result}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Niche Match Quality */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Match Quality by Niche</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {NICHE_MATCH_QUALITY.map((item) => (
                <div key={item.niche} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-700 uppercase tracking-widest">{item.niche}</span>
                    <span className="text-primary">{item.avg}% Efficiency</span>
                  </div>
                  <Progress value={item.avg} className="h-1.5 bg-slate-50" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Manual Intervention Banner */}
          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sliders className="h-16 w-16" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Governance Override</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Manually adjust creator authenticity scores for cases where neural detection requires human verification.
                </p>
              </div>
              <Button 
                onClick={() => {
                  setSelectedCreator({ handle: 'marcus_fit', name: 'Marcus Thorne', current: 89 });
                  setIsOverrideOpen(true);
                }}
                className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl h-12 text-[10px] uppercase tracking-widest shadow-lg"
              >
                Launch Score Override
              </Button>
            </CardContent>
          </Card>

        </aside>
      </div>

      {/* Manual Override Dialog */}
      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none max-w-lg shadow-2xl">
          <div className="bg-slate-50 p-8 border-b">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Sliders className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">Score Override</DialogTitle>
                  <DialogDescription className="font-medium">Adjusting authenticity for @{selectedCreator?.handle}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-10 space-y-8">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current AI Prediction</p>
                <p className="text-xl font-black text-slate-900">{selectedCreator?.current}%</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
              <div className="text-right">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">New Adjusted Score</p>
                <p className="text-xl font-black text-primary">{newScore ? `${newScore}%` : '--%'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Target Authenticity Score (%)</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 95" 
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold text-lg"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Audit Reason (Logged)</Label>
                <Textarea 
                  placeholder="Specify findings from manual profile audit..." 
                  className="min-h-[120px] rounded-2xl p-6 bg-slate-50 border-none resize-none"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t gap-3">
            <Button variant="ghost" className="rounded-xl font-bold h-12 px-6" onClick={() => setIsOverrideOpen(false)}>Cancel Audit</Button>
            <Button 
              disabled={!newScore || !overrideReason || isSubmitting}
              onClick={handleOverride}
              className="rounded-xl font-black h-12 px-10 shadow-xl bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Apply Audit Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
