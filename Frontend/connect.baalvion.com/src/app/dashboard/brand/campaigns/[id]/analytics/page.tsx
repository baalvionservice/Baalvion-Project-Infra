'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  Users, 
  Zap, 
  MousePointer2, 
  ShoppingBag, 
  IndianRupee, 
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Share2
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
  PieChart,
  Pie
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Mock Data for Analytics
const TIMELINE_DATA = [
  { name: 'Jul 01', reach: 45000, engagement: 2400 },
  { name: 'Jul 05', reach: 120000, engagement: 8100 },
  { name: 'Jul 10', reach: 380000, engagement: 22000 },
  { name: 'Jul 15', reach: 650000, engagement: 45000 },
  { name: 'Jul 20', reach: 890000, engagement: 62000 },
  { name: 'Jul 25', reach: 1100000, engagement: 78000 },
  { name: 'Jul 30', reach: 1245000, engagement: 82000 },
];

const CREATOR_PERFORMANCE = [
  { name: 'Sarah Chen', reach: 450000, er: 8.2, cpe: 1.2, score: 98 },
  { name: 'Alex Rivers', reach: 320000, er: 6.5, cpe: 1.8, score: 92 },
  { name: 'Elena Vance', reach: 280000, er: 7.1, cpe: 1.5, score: 95 },
  { name: 'Marcus Thorne', reach: 195000, er: 5.4, cpe: 2.1, score: 88 },
];

const ENGAGEMENT_BREAKDOWN = [
  { name: 'Likes', value: 45000, color: '#6C3AE8' },
  { name: 'Shares', value: 12000, color: '#F97316' },
  { name: 'Saves', value: 8500, color: '#10B981' },
  { name: 'Comments', value: 16500, color: '#3B82F6' },
];

const CAMPAIGN_INFO = {
  title: 'AI Smart Home Ecosystem Review',
  brand: 'Lumina Tech',
  logo: 'https://picsum.photos/seed/lumina/100/100',
  budget: 45000,
  status: 'ACTIVE'
};

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('30');

  const stats = [
    { label: 'Total Reach', value: '1.2M+', trend: '+15.2%', icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Impressions', value: '4.5M', trend: '+12.8%', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Engagement Rate', value: '5.82%', trend: '+0.5%', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Clicks', value: '42.5k', trend: '+8.4%', icon: MousePointer2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Conversions', value: '1,240', trend: '+5.1%', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Cost Per Eng.', value: '₹1.45', trend: '-₹0.10', icon: IndianRupee, color: 'text-slate-900', bg: 'bg-slate-100' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-xl border shadow-sm">
              <AvatarImage src={CAMPAIGN_INFO.logo} />
              <AvatarFallback>LT</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{CAMPAIGN_INFO.title}</h1>
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase">Live Analytics</Badge>
              </div>
              <p className="text-sm text-slate-500 font-medium">Performance tracking for {CAMPAIGN_INFO.brand}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] h-11 rounded-xl bg-white font-bold border-slate-200">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <SelectValue placeholder="Last 30 Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Full Campaign</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-none shadow-sm shadow-slate-200/50 rounded-2xl p-5 bg-white group hover:shadow-md transition-shadow">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-colors", stat.bg, stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-xl font-black mt-1 text-slate-900">{stat.value}</h3>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold mt-2",
                stat.trend.startsWith('+') ? "text-emerald-600" : "text-slate-500"
              )}>
                {stat.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.trend}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Performance Timeline */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Campaign Trajectory</CardTitle>
                <CardDescription>Daily reach and engagement milestones</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Reach</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Engagement</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TIMELINE_DATA}>
                    <defs>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C3AE8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6C3AE8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                      tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="reach" 
                      stroke="#6C3AE8" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorReach)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#10B981" 
                      strokeWidth={4} 
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Creator Comparison Table */}
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Creator Performance Audit</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary font-black uppercase text-[10px] tracking-widest">
                  View All Partners <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest">Creator</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Reach</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Engagement</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">CPE</TableHead>
                    <TableHead className="pr-8 font-black text-[10px] uppercase tracking-widest text-right">ROI Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CREATOR_PERFORMANCE.map((creator, i) => (
                    <TableRow key={creator.name} className="border-slate-50 group hover:bg-slate-50/50 transition-colors h-20">
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-xl border border-slate-100">
                            <AvatarFallback className="bg-primary/5 text-primary font-bold">{creator.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-slate-900">{creator.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Verified</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">{(creator.reach / 1000).toFixed(0)}k</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold">{creator.er}%</Badge>
                      </TableCell>
                      <TableCell className="text-center text-slate-500 font-medium">₹{creator.cpe}</TableCell>
                      <TableCell className="pr-8 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-black text-primary">{creator.score}%</span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${creator.score}%` }} />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Engagement Breakdown Donut */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" />
                Engagement Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[220px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ENGAGEMENT_BREAKDOWN}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {ENGAGEMENT_BREAKDOWN.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {ENGAGEMENT_BREAKDOWN.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: item.color}} />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none">{item.name}</p>
                      <p className="text-xs font-bold text-slate-900 mt-1">{item.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Strategy Digest */}
          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="h-16 w-16" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <Zap className="h-6 w-6 text-yellow-300 fill-yellow-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">AI Recommendations</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Campaign efficiency is <span className="text-emerald-400 font-bold">12% higher</span> than your previous "Smart Kitchen" launch. 
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Optimized Scaling</p>
                  <p className="text-[11px] text-white/80 font-medium">Re-hire **Sarah Chen** for Q4. Her audience conversion rate is 3.2x higher than niche benchmarks.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Format Shift</p>
                  <p className="text-[11px] text-white/80 font-medium">Allocating 20% more budget to **Reels** vs Static Posts suggested for next month.</p>
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black rounded-xl h-12 text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                Generate Full Strategy
              </Button>
            </CardContent>
          </Card>

          {/* Export & Share Summary */}
          <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
              <Share2 className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">External Sharing</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Share a live, view-only analytics dashboard with stakeholders or external partners.
              </p>
            </div>
            <Button variant="outline" className="w-full rounded-xl font-bold border-slate-200 h-10 text-xs">Create View-Only Link</Button>
          </div>

        </div>
      </div>
    </div>
  );
}

function Eye(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
