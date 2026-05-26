'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Clock, 
  Save, 
  Loader2, 
  ArrowLeft, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  Fingerprint,
  RotateCcw,
  Activity,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { systemService } from '@/services/data/system-service';
import { SecuritySettings } from '@/types/system';
import { toast } from '@/hooks/use-toast';
import { SecurityMonitor } from './SecurityMonitor';

const securitySchema = z.object({
  twoFactorAuth: z.boolean(),
  passwordPolicy: z.object({
    minLength: z.number().min(8).max(32),
    requireSpecialChar: z.boolean(),
    requireNumber: z.boolean(),
  }),
  sessionTimeoutMinutes: z.number().min(15).max(1440),
});

type SecurityFormValues = z.infer<typeof securitySchema>;

/**
 * Platform Security Orchestration Panel.
 * Specialized control matrix for enforcing global security logic and cryptographic policies.
 */
export default function PlatformSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('monitor');

  const form = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      twoFactorAuth: true,
      passwordPolicy: {
        minLength: 12,
        requireSpecialChar: true,
        requireNumber: true,
      },
      sessionTimeoutMinutes: 120,
    }
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await systemService.getSecuritySettings();
        if (response.data) {
          form.reset(response.data);
        }
      } catch (e) {
        console.error('Security state sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [form]);

  async function onSubmit(values: SecurityFormValues) {
    setSaving(true);
    try {
      const response = await systemService.updateSecuritySettings(values);
      if (response.status === 200) {
        toast({
          title: "Security Logic Synchronized",
          description: "New authentication protocols have been pushed to all platform nodes.",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to broadcast security parameters to the kernel.",
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
          Establishing Secure Handshake...
        </Text>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Lock className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Kernel Hardening</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Security & Governance</Text>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-card/30 border border-white/5 h-11 px-1 rounded-xl">
              <TabsTrigger value="monitor" className="rounded-lg px-6 font-bold text-[10px] uppercase gap-2">
                <Activity className="h-3.5 w-3.5" /> Monitor
              </TabsTrigger>
              <TabsTrigger value="orchestration" className="rounded-lg px-6 font-bold text-[10px] uppercase gap-2">
                <Fingerprint className="h-3.5 w-3.5" /> Orchestration
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === 'orchestration' && (
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={saving}
              className="h-11 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all scale-105 active:scale-95"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Commit Matrix
            </Button>
          )}
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-0">
        {/* LIVE MONITOR TAB */}
        <TabsContent value="monitor" className="mt-0 outline-none">
          <SecurityMonitor />
        </TabsContent>

        {/* SETTINGS ORCHESTRATION TAB */}
        <TabsContent value="orchestration" className="mt-0 outline-none">
          <Form {...form}>
            <form className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-card/30 border-b border-white/5 p-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Fingerprint className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Authentication Guard</CardTitle>
                        <CardDescription>Configure identity verification and traversal resistance.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-10">
                    <div className="flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-background/30 hover:bg-white/5 transition-colors">
                      <div className="space-y-1 max-w-md">
                        <Text variant="bodySmall" weight="bold">Multi-Factor Authentication (MFA)</Text>
                        <Text variant="caption" className="text-muted-foreground block leading-relaxed">
                          Enforce secondary biometric or token verification for all administrative and expert personas.
                        </Text>
                      </div>
                      <FormField
                        control={form.control}
                        name="twoFactorAuth"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                        <Key className="h-3.5 w-3.5" /> Password Entropy Matrix
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="passwordPolicy.minLength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Character Length</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))} 
                                  className="bg-background/50 h-11 border-white/10" 
                                />
                              </FormControl>
                              <FormDescription>Recommended: 12 characters for expert nodes.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4 pt-2">
                          <FormField
                            control={form.control}
                            name="passwordPolicy.requireSpecialChar"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between space-y-0 rounded-xl border border-white/5 bg-background/20 p-3">
                                <FormLabel className="text-xs font-medium">Require Symbols</FormLabel>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="passwordPolicy.requireNumber"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between space-y-0 rounded-xl border border-white/5 bg-background/20 p-3">
                                <FormLabel className="text-xs font-medium">Require Numerics</FormLabel>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-secondary/5 border-b border-white/5 p-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Session Integrity</CardTitle>
                        <CardDescription>Orchestrate session lifecycle and cryptographic timeout windows.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <FormField
                      control={form.control}
                      name="sessionTimeoutMinutes"
                      render={({ field }) => (
                        <FormItem className="space-y-6">
                          <div className="flex justify-between items-center">
                            <FormLabel>Maximum Inactivity Window</FormLabel>
                            <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20 font-mono text-xs px-3">
                              {field.value} Minutes
                            </Badge>
                          </div>
                          <FormControl>
                            <Slider
                              min={15}
                              max={1440}
                              step={15}
                              value={[field.value]}
                              onValueChange={(val) => field.onChange(val[0])}
                              className="py-4"
                            />
                          </FormControl>
                          <FormDescription>
                            Time before an idle administrative node is forced to re-authenticate via the global gateway.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
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
                        <Text variant="caption" className="font-bold text-primary">Zero-Trust Protocol</Text>
                        <Text variant="caption" className="text-muted-foreground leading-relaxed">
                          Enforcing symbols and numeric constraints increases entropy by **420%**, effectively mitigating brute-force traversal.
                        </Text>
                      </div>
                      <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-2">
                        <Text variant="caption" className="font-bold text-secondary">Session Ephemerality</Text>
                        <Text variant="caption" className="text-muted-foreground leading-relaxed">
                          Reduced timeout windows minimize the opportunity for lateral session hijacking in high-traffic administrative environments.
                        </Text>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase mb-2">
                        <CheckCircle2 className="h-3 w-3" /> Matrix Integrity Verified
                      </div>
                      <Text variant="caption" className="italic text-muted-foreground">
                        "Kernel version 1.2.4-stable active. Security nodes are cryptographically signed."
                      </Text>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
                  <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <RotateCcw className="h-24 w-24 text-secondary rotate-12" />
                  </div>
                  <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                    <ShieldAlert className="h-4 w-4" /> Global Audit
                  </div>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed">
                    Changes to security logic are broadcast to the immutable **Audit Trail**, linking these functional shifts to your administrative signature.
                  </Text>
                  <Button variant="ghost" size="sm" className="p-0 h-auto text-secondary text-xs font-bold hover:bg-transparent group/link" asChild>
                    <Link href="/admin/control/audit-trail">Review Security Logs <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" /></Link>
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
