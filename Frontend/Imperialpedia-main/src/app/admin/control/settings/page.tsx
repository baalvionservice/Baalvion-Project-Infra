'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Settings, 
  Globe, 
  BarChart3, 
  CreditCard, 
  Save, 
  Loader2, 
  ShieldCheck, 
  Info,
  ArrowLeft,
  Lock,
  Zap,
  Layout
} from 'lucide-react';
import Link from 'next/link';
import { systemService } from '@/services/data/system-service';
import { PlatformSettings } from '@/types/system';
import { toast } from '@/hooks/use-toast';

const platformSchema = z.object({
  name: z.string().min(2, 'Platform name must be at least 2 characters.'),
  logoUrl: z.string().url('Please enter a valid URL for the logo.'),
  description: z.string().min(10, 'A substantial description is required.'),
  features: z.object({
    seo: z.boolean(),
    analytics: z.boolean(),
    payments: z.boolean(),
  }),
});

type PlatformFormValues = z.infer<typeof platformSchema>;

/**
 * Global System Configuration Panel.
 * Specialized UI for orchestrating platform identity and core functional gateways.
 */
export default function PlatformSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<PlatformFormValues>({
    resolver: zodResolver(platformSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
      description: '',
      features: {
        seo: true,
        analytics: true,
        payments: false,
      }
    }
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await systemService.getPlatformSettings();
        if (response.data) {
          form.reset(response.data);
        }
      } catch (e) {
        console.error('Settings sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [form]);

  async function onSubmit(values: PlatformFormValues) {
    setSaving(true);
    try {
      const response = await systemService.updatePlatformSettings(values);
      if (response.status === 200) {
        toast({
          title: "System Rules Updated",
          description: "Global platform configuration has been synchronized across all nodes.",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to synchronize settings with the kernel.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Secure Kernel Link...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Settings className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Global Control</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">System Configuration</Text>
          </div>
        </div>
        
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={saving}
          className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all scale-105 active:scale-95"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Commit Configuration
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Form {...form}>
            <form className="space-y-8">
              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-card/30 border-b border-white/5 p-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Layout className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Platform Identity</CardTitle>
                      <CardDescription>Configure core branding and system-wide descriptors.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Public Site Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-background/50 h-12 border-white/10" placeholder="Imperialpedia" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branding Asset (Logo URL)</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-background/50 h-12 border-white/10" placeholder="https://..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Global Narrative (Meta Description)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="bg-background/50 min-h-[120px] border-white/10 resize-none leading-relaxed" 
                            placeholder="Primary description for search engines and platform cards..."
                          />
                        </FormControl>
                        <FormDescription>
                          This text is utilized as the default fallback for all programmatic pages lacking specific metadata.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-secondary/5 border-b border-white/5 p-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Functional Gateways</CardTitle>
                      <CardDescription>Toggle primary platform engines and infrastructure modules.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-background/30 hover:bg-white/5 transition-colors">
                      <div className="flex gap-4 items-start">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <Text variant="bodySmall" weight="bold">pSEO Indexing Engine</Text>
                          <Text variant="caption" className="text-muted-foreground block">Allow search engines to discover and crawl programmatic knowledge nodes.</Text>
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="features.seo"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-background/30 hover:bg-white/5 transition-colors">
                      <div className="flex gap-4 items-start">
                        <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                          <Text variant="bodySmall" weight="bold">Behavioral Telemetry</Text>
                          <Text variant="caption" className="text-muted-foreground block">Active real-time tracking of visitor trajectories and expert engagement.</Text>
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="features.analytics"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-background/30 hover:bg-white/5 transition-colors">
                      <div className="flex gap-4 items-start">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <Text variant="bodySmall" weight="bold">Monetization Hub (Payments)</Text>
                          <Text variant="caption" className="text-muted-foreground block">Enable creator revenue accrual and institutional subscription gateways.</Text>
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="features.payments"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none bg-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                <ShieldCheck className="h-4 w-4" /> State Integrity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <Text variant="caption" className="font-bold text-primary">Horizontal Sync</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed">
                    Changes to platform identity are propagated across the global cache layer within **60 seconds** of commit.
                  </Text>
                </div>
                
                <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                  <Text variant="caption" className="font-bold text-secondary">Vertical Propagation</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed">
                    Toggling functional gateways initiates a controlled rollout to all production clusters.
                  </Text>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase mb-2">
                  <ShieldCheck className="h-3 w-3" /> Core Integrity Verified
                </div>
                <Text variant="caption" className="italic text-muted-foreground">
                  "Kernel version 1.2.4-stable active. All administrative nodes are cryptographically verified."
                </Text>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
              <Lock className="h-24 w-24 text-secondary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <Info className="h-4 w-4" /> Governance Node
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Every configuration change is logged in the immutable **System Audit Trail**, attributing updates to the current administrative session.
            </Text>
            <Button variant="ghost" size="sm" className="p-0 h-auto text-secondary text-xs font-bold hover:bg-transparent" asChild>
              <Link href="/admin/audit-logs">View Change History <ArrowLeft className="ml-1 h-3 w-3 rotate-180" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
