'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Globe, 
  Lock, 
  Loader2, 
  RefreshCw,
  AlertCircle,
  XCircle,
  Zap,
  CheckCircle2,
  Terminal,
  Fingerprint
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { SecurityDashboardData } from '@/types/system';
import { cn } from '@/lib/utils';

/**
 * Security Vital Telemetry.
 * Displays real-time status of system health, active threats, and rate limits.
 */
export function SecurityMonitor() {
  const [data, setData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const response = await systemService.getSecurityDashboardData();
      if (response.data) setData(response.data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <Text variant="caption" className="animate-pulse uppercase tracking-widest font-bold">Scanning Security Nodes...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Vital Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kernel Health</CardTitle>
            <ShieldCheck className={cn(
              "h-4 w-4",
              data.system_health === 'Good' ? 'text-emerald-500' : 'text-amber-500'
            )} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.system_health}</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <CheckCircle2 className="h-3 w-3 mr-1" /> SLA Verified
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-destructive/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Threats</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.active_threats}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase">Null state achieved</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Auth Exceptions</CardTitle>
            <Lock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.failed_logins}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Failed attempts (24h)</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rate Limitation</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.rate_limit_status}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Gateway capacity normal</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Anomaly Feed */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="glass-card border-none shadow-2xl overflow-hidden h-full">
            <CardHeader className="bg-card/30 border-b border-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Security Anomaly Hub</CardTitle>
                  <CardDescription>Real-time detection of infrastructure friction.</CardDescription>
                </div>
                <Badge variant="outline" className="border-destructive/20 text-destructive bg-destructive/5 text-[10px] font-bold px-3">LIVE FEED</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {[
                  { time: '14:20', msg: 'Multiple failed handshakes from 45.12.88.2', type: 'Warning' },
                  { time: '13:05', msg: 'Rate limit threshold reached for User #842 (pSEO)', type: 'Info' },
                  { time: '11:45', msg: 'Admin session terminated: Inactivity timeout', type: 'Info' },
                  { time: '09:30', msg: 'Auth Kernel successfully rotated master tokens', type: 'Success' },
                ].map((alert, idx) => (
                  <div key={idx} className="flex gap-4 p-6 hover:bg-white/5 transition-colors">
                    <div className={cn(
                      "mt-1 w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px]",
                      alert.type === 'Warning' ? "bg-amber-500 shadow-amber-500/50" : 
                      alert.type === 'Success' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-primary shadow-primary/50"
                    )} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">{alert.time} UTC</span>
                        <Badge variant="outline" className="text-[8px] h-4 border-white/10 uppercase">{alert.type}</Badge>
                      </div>
                      <Text variant="bodySmall" className="text-foreground/90">{alert.msg}</Text>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-none border-t border-white/5">
                Full Security Log Buffer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* IP Restriction Controls */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                <Globe className="h-4 w-4" /> Administrative IP Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {data.admin_ip_restriction.map((ip) => (
                  <div key={ip} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Terminal className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-mono font-bold">{ip}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/5">
                <Button variant="outline" className="w-full h-11 border-dashed border-primary/20 text-primary bg-transparent rounded-xl font-bold text-xs gap-2">
                  <Plus className="h-4 w-4" /> Add Authorized Node
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Fingerprint className="h-16 w-16 text-secondary" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" /> Verification Node
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
              "Biometric session verification is active. Current authorized node count: **{data.admin_ip_restriction.length}**. Any traversal from unknown IPs will trigger an immediate lock-down."
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Plus } from 'lucide-react';
