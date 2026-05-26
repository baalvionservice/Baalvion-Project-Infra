'use client';

import React from 'react';
import { SecurityFlag, SecurityAlert } from '@/types/system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Zap, 
  Activity, 
  Globe, 
  FileLock, 
  ShieldX,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecurityFlagsProps {
  flags: SecurityFlag[];
  alerts: SecurityAlert[];
}

/**
 * Security Indicators Matrix.
 * Displays mock infrastructure protection flags and active security alerts.
 */
export function SecurityFlags({ flags, alerts }: SecurityFlagsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Infrastructure Protection Matrix */}
      <Card className="glass-card border-none shadow-xl overflow-hidden h-full">
        <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Protection Matrix</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {flags.map((flag, idx) => (
              <div key={idx} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-background/50 border border-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                    {flag.feature.includes('Encryption') ? <Lock className="h-4 w-4" /> : 
                     flag.feature.includes('GDPR') ? <Globe className="h-4 w-4" /> : 
                     <FileLock className="h-4 w-4" />}
                  </div>
                  <Text variant="bodySmall" weight="bold">{flag.feature}</Text>
                </div>
                <Badge className={cn(
                  "border-none text-[9px] font-bold uppercase h-6 px-3 shadow-inner",
                  flag.status === 'mock_enabled' ? "bg-emerald-500/10 text-emerald-500" :
                  flag.status === 'mock_displayed' ? "bg-primary/10 text-primary" :
                  "bg-muted text-muted-foreground"
                )}>
                  {flag.status === 'mock_enabled' ? 'Active' : 
                   flag.status === 'mock_displayed' ? 'Displayed' : 'Bypassed'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Threat Telemetry */}
      <Card className="glass-card border-none shadow-xl overflow-hidden h-full">
        <CardHeader className="bg-destructive/5 border-b border-white/5 p-6">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Threat Telemetry</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {alerts.map((alert, idx) => (
              <div key={idx} className="p-5 flex items-center justify-between bg-destructive/5 group">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive animate-pulse">
                    <ShieldX className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <Text variant="bodySmall" weight="bold" className="text-destructive">{alert.alert_type}</Text>
                    <Text variant="caption" className="text-muted-foreground font-mono">User ID: {alert.user}</Text>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <Badge variant="destructive" className="text-[8px] font-bold uppercase h-5">Triggered</Badge>
                  <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> 4m ago
                  </span>
                </div>
              </div>
            ))}
            
            {alerts.length === 0 && (
              <div className="p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-500">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <Text variant="caption" className="text-muted-foreground italic">No active threats localized in the security buffer.</Text>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-muted/20 border-t border-white/5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
                "Anomaly detection engine is currently benchmarking at **18ms** latency across the auth ring."
              </Text>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
