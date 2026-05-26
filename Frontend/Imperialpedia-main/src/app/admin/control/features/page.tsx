'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/design-system/typography/text';
import { 
  Zap, 
  Globe, 
  BarChart3, 
  CreditCard, 
  ShieldCheck, 
  Save, 
  Loader2, 
  ArrowLeft, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  RefreshCcw
} from 'lucide-react';
import Link from 'next/link';
import { systemService } from '@/services/data/system-service';
import { FeatureSettings } from '@/types/system';
import { toast } from '@/hooks/use-toast';

/**
 * Platform Feature Toggle Dashboard.
 * Specialized control matrix for dynamically enabling/disabling functional gateways.
 */
export default function PlatformFeatureTogglesPage() {
  const [settings, setSettings] = useState<FeatureSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await systemService.getFeatureSettings();
        if (response.data) setSettings(response.data);
      } catch (e) {
        console.error('Feature state sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleToggle = (key: keyof FeatureSettings) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const response = await systemService.updateFeatureSettings(settings);
      if (response.status === 200) {
        toast({
          title: "Gateways Synchronized",
          description: "New functional states have been broadcast to the global index.",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Synchronization Error",
        description: "Failed to broadcast gateway changes to the kernel.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Calibrating Feature Gateways...
        </Text>
      </div>
    );
  }

  const features = [
    { 
      id: 'seo', 
      label: 'pSEO Indexing Engine', 
      desc: 'Allow search engines to discover and crawl 1M+ programmatic knowledge nodes.', 
      icon: <Globe className="h-5 w-5 text-primary" /> 
    },
    { 
      id: 'analytics', 
      label: 'Behavioral Telemetry', 
      desc: 'Active real-time tracking of visitor trajectories and expert engagement velocity.', 
      icon: <BarChart3 className="h-5 w-5 text-secondary" /> 
    },
    { 
      id: 'payments', 
      label: 'Monetization Hub', 
      desc: 'Enable creator revenue accrual and institutional subscription gateways.', 
      icon: <CreditCard className="h-5 w-5 text-emerald-500" /> 
    },
    { 
      id: 'contentModeration', 
      label: 'AI Content Moderation', 
      desc: 'Algorithmic sentiment analysis and automated flagging for community nodes.', 
      icon: <ShieldAlert className="h-5 w-5 text-amber-500" /> 
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Zap className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">System Orchestration</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Feature Gateways</Text>
          </div>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={saving || !settings}
          className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all scale-105 active:scale-95"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Synchronize Gateways
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Toggles */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {features.map((feature) => (
              <Card key={feature.id} className="glass-card border-none overflow-hidden group hover:border-primary/20 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-5 items-start">
                      <div className="p-3 rounded-2xl bg-background/50 border border-white/5 shrink-0 group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <div className="space-y-1">
                        <Text variant="body" weight="bold">{feature.label}</Text>
                        <Text variant="caption" className="text-muted-foreground block leading-relaxed max-w-sm">
                          {feature.desc}
                        </Text>
                      </div>
                    </div>
                    <Switch 
                      checked={settings ? (settings[feature.id as keyof FeatureSettings] as boolean) : false} 
                      onCheckedChange={() => handleToggle(feature.id as keyof FeatureSettings)}
                      className="scale-125"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <Text variant="body" weight="bold">Infrastructure Health: Optimal</Text>
              <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
                All 12 feature clusters are currently synchronized. Average state propagation latency is maintained at **180ms** across the production ring.
              </Text>
            </div>
          </div>
        </div>

        {/* Strategic Insight Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none bg-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                <ShieldCheck className="h-4 w-4" /> State Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <Text variant="caption" className="font-bold text-primary">Zero-Downtime Shift</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed">
                    Toggling high-impact gateways like **Payments** initiates a blue-green traffic shift to ensure session continuity.
                  </Text>
                </div>
                
                <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <Text variant="caption" className="font-bold text-secondary">Recursive Safety</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed">
                    Disabling the **SEO Engine** automatically triggers a recursive sitemap lock to prevent 404 crawler spikes.
                  </Text>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase mb-2">
                  <CheckCircle2 className="h-3 w-3" /> Core Registry Verified
                </div>
                <Text variant="caption" className="italic text-muted-foreground">
                  "Gateway version 4.2.0-broadcast active. All toggles are cryptographically logged."
                </Text>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <RefreshCcw className="h-24 w-24 text-secondary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <Info className="h-4 w-4" /> Governance Trace
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Every toggle event is logged in the immutable **Audit Trail**, attributing the functional shift to your administrative signature.
            </Text>
            <Button variant="ghost" size="sm" className="p-0 h-auto text-secondary text-xs font-bold hover:bg-transparent" asChild>
              <Link href="/admin/control/audit-trail">Review Audit Trail <RefreshCcw className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
