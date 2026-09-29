'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Bell, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  History, 
  Rocket,
  Globe,
  Loader2,
  Mail
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock Service Data
const SERVICES = [
  { id: 'api', name: 'Marketplace API', status: 'OPERATIONAL', uptime: '99.98%', desc: 'Handles all core marketplace data and authentication.' },
  { id: 'payouts', name: 'Escrow Payments', status: 'OPERATIONAL', uptime: '100%', desc: 'Secure campaign funding and creator payout settlement.' },
  { id: 'ai', name: 'AI Matching Engine', status: 'DEGRADED', uptime: '98.4%', desc: 'Matchmaking and ROI prediction services.' },
  { id: 'notify', name: 'Notifications', status: 'OPERATIONAL', uptime: '99.95%', desc: 'In-app alerts, push notifications, and email delivery.' },
  { id: 'storage', name: 'Cloud Storage', status: 'OPERATIONAL', uptime: '100%', desc: 'Deliverable assets and user portfolio media.' },
];

// Mock Incident History
const INCIDENTS = [
  { 
    id: 'inc_1', 
    title: 'AI Matching Latency', 
    date: 'July 18, 2024', 
    status: 'INVESTIGATING', 
    severity: 'DEGRADED',
    updates: [
      { time: '14:20 UTC', text: 'We are observing increased latency in the AI matching engine. Applications may take longer to process.' },
      { time: '15:45 UTC', text: 'Identified a bottleneck in the vector database. Mitigation is in progress.' }
    ]
  },
  { 
    id: 'inc_2', 
    title: 'Intermittent Payment Failures', 
    date: 'June 05, 2024', 
    status: 'RESOLVED', 
    severity: 'OUTAGE',
    updates: [
      { time: '09:00 UTC', text: 'UPI payments are failing for some users. Investigating gateway connectivity.' },
      { time: '11:30 UTC', text: 'Issue resolved. All failed transactions have been automatically reconciled.' }
    ]
  },
  { 
    id: 'inc_3', 
    title: 'Scheduled Maintenance', 
    date: 'May 20, 2024', 
    status: 'COMPLETED', 
    severity: 'INFO',
    updates: [
      { time: '02:00 UTC', text: 'Maintenance started to upgrade core database clusters.' },
      { time: '04:00 UTC', text: 'Maintenance completed successfully. No downtime was observed.' }
    ]
  }
];

export default function PlatformStatusPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail('');
      toast({ title: "Subscribed!", description: "You'll receive alerts for any service disruptions." });
    }, 1500);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'OPERATIONAL': return { label: 'Operational', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2 };
      case 'DEGRADED': return { label: 'Degraded Performance', color: 'text-orange-500', bg: 'bg-orange-50', icon: AlertTriangle };
      case 'OUTAGE': return { label: 'Partial Outage', color: 'text-red-500', bg: 'bg-red-50', icon: XCircle };
      default: return { label: 'Unknown', color: 'text-slate-400', bg: 'bg-slate-50', icon: Clock };
    }
  };

  const systemHealth = SERVICES.every(s => s.status === 'OPERATIONAL') ? 'OPTIMAL' : 'PARTIAL_DEGRADATION';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
     

      <main className="container max-w-5xl mx-auto px-4 pt-12 space-y-12">
        {/* Global Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={cn(
            "border-none shadow-xl rounded-[2.5rem] overflow-hidden",
            systemHealth === 'OPTIMAL' ? "bg-emerald-500" : "bg-orange-500"
          )}>
            <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  {systemHealth === 'OPTIMAL' ? <ShieldCheck className="h-10 w-10" /> : <AlertTriangle className="h-10 w-10" />}
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight">
                    {systemHealth === 'OPTIMAL' ? 'All Systems Operational' : 'Partial Service Degraded'}
                  </h1>
                  <p className="text-white/80 font-medium mt-1">Verified as of {new Date().toLocaleTimeString()} • {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white border-none px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase">
                  Uptime: 99.98%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SERVICES.map((service, i) => {
            const config = getStatusConfig(service.status);
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-none shadow-sm rounded-3xl bg-white group hover:shadow-md transition-all h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-900 uppercase tracking-tighter">{service.name}</h3>
                      <Badge className={cn("border-none px-3 py-1 rounded-full font-black text-[10px] uppercase", config.bg, config.color)}>
                        <config.icon className="h-3 w-3 mr-1.5" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{service.desc}</p>
                    
                    <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 24 }).map((_, j) => (
                          <div 
                            key={j} 
                            className={cn(
                              "h-6 w-1 rounded-full",
                              service.status === 'DEGRADED' && j > 18 ? "bg-orange-400" : "bg-emerald-400",
                              j % 4 === 0 && "opacity-40"
                            )} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{service.uptime} uptime</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Incident History */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <History className="h-6 w-6 text-primary" />
              Incident History
            </h2>
            <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold px-3">Last 90 Days</Badge>
          </div>

          <div className="space-y-6">
            {INCIDENTS.map((incident, idx) => (
              <Card key={incident.id} className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">{incident.title}</CardTitle>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{incident.date}</p>
                  </div>
                  <Badge className={cn(
                    "px-4 py-1.5 rounded-full font-black text-[10px] uppercase border-none",
                    incident.status === 'RESOLVED' ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {incident.status}
                  </Badge>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {incident.updates.map((update, uIdx) => (
                    <div key={uIdx} className="flex gap-6 relative last:after:hidden after:absolute after:left-[5px] after:top-6 after:bottom-0 after:w-px after:bg-slate-100">
                      <div className="h-3 w-3 rounded-full bg-slate-200 mt-1.5 shrink-0 z-10" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{update.time}</p>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{update.text}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Subscription Callout */}
        <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Bell className="h-32 w-32" />
          </div>
          <CardContent className="p-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-md space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-3xl font-black">Stay Informed</h3>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                Subscribe to receive real-time email notifications whenever Baalvion Connect services are impacted.
              </p>
            </div>
            
            <form onSubmit={handleSubscribe} className="w-full md:w-[400px] space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-500" />
                <Input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary text-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Subscribe to Updates"}
              </Button>
              <p className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-widest">No marketing spam. Only status alerts.</p>
            </form>
          </CardContent>
        </Card>

        {/* Footer Support */}
        <div className="text-center space-y-4">
          <p className="text-slate-400 font-medium">Experiencing a unique issue?</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard/support">
              <Button variant="outline" className="rounded-xl font-bold bg-white border-slate-200">
                Contact Support Team
              </Button>
            </Link>
            <Button variant="ghost" className="text-slate-400 font-bold hover:text-primary">
              <Globe className="h-4 w-4 mr-2" /> API Documentation
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
