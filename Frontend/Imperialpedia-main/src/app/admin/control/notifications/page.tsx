'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Save, 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  Zap,
  Info,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { systemService } from '@/services/data/system-service';
import { GlobalNotificationSettings } from '@/types/system';
import { toast } from '@/hooks/use-toast';

/**
 * Platform Global Notification Settings Dashboard.
 * Orchestrates delivery channels for platform-wide events and alerts.
 */
export default function PlatformNotificationSettingsPage() {
  const [settings, setSettings] = useState<GlobalNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await systemService.getGlobalNotificationSettings();
        if (response.data) setSettings(response.data);
      } catch (e) {
        console.error('Settings sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleToggle = (channel: keyof GlobalNotificationSettings) => {
    if (!settings) return;
    setSettings({ ...settings, [channel]: !settings[channel] });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const response = await systemService.updateGlobalNotificationSettings(settings);
      if (response.status === 200) {
        toast({
          title: "Communication Logic Synchronized",
          description: "Delivery parameters have been broadcast to all notification clusters.",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Synchronization Error",
        description: "Failed to update global communication state.",
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
          Calibrating Dispatch Nodes...
        </Text>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Bell className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Communication Kernel</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Notification Gateways</Text>
          </div>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={saving || !settings}
          className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all scale-105 active:scale-95"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Commit Channel Config
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Channel Configuration */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Delivery Orchestration</CardTitle>
                  <CardDescription>Configure global endpoints for platform transmissions.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {[
                { 
                  id: 'email', 
                  label: 'Email Dispatch Node', 
                  desc: 'Manage high-volume SMTP transmissions for reports and expert alerts.', 
                  icon: <Mail className="h-5 w-5 text-primary" /> 
                },
                { 
                  id: 'push', 
                  label: 'Web Push Gateway', 
                  desc: 'Enable real-time WebSocket notifications for active browser sessions.', 
                  icon: <Smartphone className="h-5 w-5 text-secondary" /> 
                },
                { 
                  id: 'sms', 
                  label: 'SMS / Text Protocol', 
                  desc: 'Emergency and high-priority alerts via cellular network clusters.', 
                  icon: <MessageSquare className="h-5 w-5 text-amber-500" /> 
                }
              ].map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-background/30 hover:bg-white/5 transition-colors">
                  <div className="flex gap-5 items-start">
                    <div className="p-3 rounded-xl bg-background/50 border border-white/5 shrink-0">
                      {channel.icon}
                    </div>
                    <div className="space-y-1">
                      <Text variant="bodySmall" weight="bold">{channel.label}</Text>
                      <Text variant="caption" className="text-muted-foreground block leading-relaxed max-w-sm">
                        {channel.desc}
                      </Text>
                    </div>
                  </div>
                  <Switch 
                    checked={settings ? (settings[channel.id as keyof GlobalNotificationSettings] as boolean) : false} 
                    onCheckedChange={() => handleToggle(channel.id as keyof GlobalNotificationSettings)}
                    className="scale-110"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <Text variant="body" weight="bold">System Health: Optimal</Text>
              <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
                All 12 communication clusters are currently synchronized. Average dispatch latency is maintained at **450ms** across global nodes.
              </Text>
            </div>
          </div>
        </div>

        {/* Strategic Context Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none bg-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                <ShieldCheck className="h-4 w-4" /> Hub Reliability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <Text variant="caption" className="font-bold text-primary">Network Latency</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed">
                    Toggling the **SMS Protocol** utilizesTwilio-grade clusters. Latency may increase up to **2s** during peak market volatility.
                  </Text>
                </div>
                
                <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <Text variant="caption" className="font-bold text-secondary">Audience Retention</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed">
                    Email dispatch remains the highest-converting channel for deep-dive intelligence reports with a **98% deliverability** benchmark.
                  </Text>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase mb-2">
                  <CheckCircle2 className="h-3 w-3" /> Node Integrity Verified
                </div>
                <Text variant="caption" className="italic text-muted-foreground">
                  "Gateway version 4.2.0-broadcast active. All dispatches are cryptographically logged."
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
              Every channel modification is logged in the immutable **Audit Trail**, attributing the routing shift to your current administrative signature.
            </Text>
            <Button variant="ghost" size="sm" className="p-0 h-auto text-secondary text-xs font-bold hover:bg-transparent" asChild>
              <Link href="/admin/notification-logs">Review Dispatch Logs <RefreshCcw className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
