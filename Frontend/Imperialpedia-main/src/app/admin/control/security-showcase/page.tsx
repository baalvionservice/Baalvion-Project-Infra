'use client';

import React, { useEffect, useState } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  Loader2, 
  Fingerprint, 
  CheckCircle2,
  Activity,
  Zap,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { systemService } from '@/services/data/system-service';
import { SecurityMockData } from '@/types/system';
import { AuthFlowMock } from './AuthFlowMock';
import { SecurityFlags } from './SecurityFlags';

/**
 * Security Infrastructure Showcase Page.
 * Specialized dashboard for prototyping and testing frontend security layers and auth flows.
 */
export default function SecurityShowcasePage() {
  const [data, setData] = useState<SecurityMockData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await systemService.getSecurityMockData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Security mock sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Secure Handshake...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Lock className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Kernel Hardening Showcase</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Security & Auth Prototyping</Text>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Zero-Trust Matrix Active</span>
        </div>
      </header>

      {/* GDPR Compliance Mock Banner (Persistent within this view) */}
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <Text variant="bodySmall" className="font-medium text-foreground/90">
            Platform governance is fully synchronized with **GDPR** and **CCPA** compliance nodes. Your data traversal is cryptographically signed.
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-9 px-4 text-xs font-bold text-primary">Review Privacy Protocol</Button>
          <Button size="sm" className="h-9 px-6 rounded-xl bg-primary text-white font-bold text-xs">Accept & Synchronize</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Auth Flow Showcase */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-2 px-2">
            <Text variant="h3" className="font-bold flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" /> Auth Orchestration
            </Text>
            <Text variant="bodySmall" className="text-muted-foreground">
              Mock multi-stage authentication including standard credentials and 2FA Handshake.
            </Text>
          </div>
          <AuthFlowMock />
          
          <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Zap className="h-16 w-16 text-primary" />
            </div>
            <div className="space-y-4">
              <Text variant="label" className="text-primary font-bold uppercase tracking-widest text-[10px]">Administrative Logic</Text>
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                Roles using the <code>admin_core</code> node are automatically redirected to the Biometric Auth node. Standard <code>user</code> personas utilize email-only verification by default.
              </Text>
              <Button variant="link" className="p-0 h-auto text-primary text-xs font-bold group/link" asChild>
                <Link href="/admin/roles">
                  Review Persona Architect <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Protection Flags & Alerts */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-2 px-2">
            <Text variant="h3" className="font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> Infrastructure Shielding
            </Text>
            <Text variant="bodySmall" className="text-muted-foreground">
              Real-time monitoring of protection layers and anomaly detection nodes.
            </Text>
          </div>
          <SecurityFlags flags={data.security_flags} alerts={data.alerts} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card bg-emerald-500/5 border-emerald-500/20 p-6 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <Text variant="bodySmall" weight="bold">Encryption at Rest</Text>
                <Text variant="caption" className="text-muted-foreground">AES-256 Bit verified node.</Text>
              </div>
            </Card>
            
            <Card className="glass-card border-secondary/20 p-6 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <Text variant="bodySmall" weight="bold">Traffic Sanitization</Text>
                <Text variant="caption" className="text-muted-foreground">Active WAF layer operating.</Text>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
