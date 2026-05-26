'use client';

import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, ShieldCheck, Clock, Globe, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * System Maintenance Notice Page.
 * Used during scheduled re-indexing or platform-wide infrastructure upgrades.
 */
export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-20 animate-in fade-in duration-1000">
      <Container className="max-w-2xl text-center space-y-12">
        <div className="space-y-6">
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-[2.5rem] bg-secondary/10 animate-pulse" />
            <div className="absolute inset-2 rounded-[2rem] border-2 border-secondary/20" />
            <Settings className="h-12 w-12 text-secondary animate-spin-slow relative z-10" />
          </div>
          
          <div className="space-y-2">
            <Badge className="bg-secondary/20 text-secondary border-none uppercase tracking-widest text-[10px] font-bold px-3 mb-2">Protocol: Upgrade</Badge>
            <Text variant="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">Index Re-sharding</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
              Imperialpedia is currently undergoing a planned structural upgrade to the **pSEO Ingestion Engine**. Discovery nodes will be unavailable for approximately 45 minutes.
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="glass-card border-none bg-background/30 p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-secondary/10 text-secondary shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div className="text-left">
              <Text variant="caption" className="text-muted-foreground uppercase font-bold text-[9px] block">Time Remaining</Text>
              <Text variant="bodySmall" weight="bold">~24 Minutes</Text>
            </div>
          </Card>
          
          <Card className="glass-card border-none bg-background/30 p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-left">
              <Text variant="caption" className="text-muted-foreground uppercase font-bold text-[9px] block">Integrity State</Text>
              <Text variant="bodySmall" weight="bold" className="text-emerald-500">Node Sealed</Text>
            </div>
          </Card>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-widest">
              <Globe className="h-4 w-4" /> Global Cluster
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold tracking-widest">
              <Zap className="h-4 w-4" /> Real-time Handshake
            </div>
          </div>
          <Text variant="caption" className="text-muted-foreground italic max-w-md mx-auto leading-relaxed">
            "We are synchronizing 1.2M+ knowledge nodes across the production ring to improve discovery latency. Thank you for your patience during this cycle."
          </Text>
        </div>
      </Container>
    </main>
  );
}
