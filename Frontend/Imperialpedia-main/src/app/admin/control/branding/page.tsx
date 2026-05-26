'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Palette, 
  Image as ImageIcon, 
  Save, 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  Info,
  CheckCircle2,
  RefreshCcw,
  Layout,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { systemService } from '@/services/data/system-service';
import { BrandingSettings } from '@/types/system';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

/**
 * Zod schema for platform branding validation.
 */
const brandingSchema = z.object({
  platformName: z.string().min(2, 'Platform label must be at least 2 characters.'),
  logoUrl: z.string().url('A valid cryptographic asset URL is required.'),
  description: z.string().min(10, 'A substantial narrative is required.'),
  colors: z.object({
    primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex code.'),
    secondary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex code.'),
  }),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

/**
 * Platform Visual Identity Studio.
 * Orchestrates platform branding, semantic descriptions, and core color tokens.
 */
export default function PlatformBrandingStudioPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      platformName: '',
      logoUrl: '',
      description: '',
      colors: {
        primary: '#8272F2',
        secondary: '#69B9FF',
      }
    }
  });

  useEffect(() => {
    async function loadBranding() {
      try {
        const response = await systemService.getBrandingSettings();
        if (response.data) {
          form.reset(response.data);
        }
      } catch (e) {
        console.error('Branding state sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadBranding();
  }, [form]);

  async function onSubmit(values: BrandingFormValues) {
    setSaving(true);
    try {
      const response = await systemService.updateBrandingSettings(values);
      if (response.status === 200) {
        toast({
          title: "Visual Identity Synchronized",
          description: "New brand parameters have been pushed to the global cache layer.",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Synchronization Error",
        description: "Failed to broadcast branding shifts to the kernel.",
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
          Establishing Design Handshake...
        </Text>
      </div>
    );
  }

  const primaryColor = form.watch('colors.primary');
  const secondaryColor = form.watch('colors.secondary');

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Palette className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Brand Orchestration</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Identity Studio</Text>
          </div>
        </div>
        
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={saving}
          className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all scale-105 active:scale-95"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Commit Brand Logic
        </Button>
      </header>

      <Form {...form}>
        <form className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Identity Config */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="glass-card border-none shadow-2xl overflow-hidden">
              <CardHeader className="bg-card/30 border-b border-white/5 p-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Layout className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Core Identity</CardTitle>
                    <CardDescription>Manage your platform's semantic markers and descriptors.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="platformName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Platform Label</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background/50 h-12 border-white/10 font-bold" placeholder="e.g. Imperialpedia" />
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
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Logo Vector URL</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-background/50 h-12 border-white/10 font-mono text-xs" placeholder="https://..." />
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
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Strategic Narrative</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="bg-background/50 min-h-[120px] border-white/10 resize-none leading-relaxed" 
                          placeholder="Primary description for search discovery nodes..."
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] italic">
                        Utilized as the fallback meta-description for all 1M+ programmatic pages.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Color Matrix */}
            <Card className="glass-card border-none shadow-2xl overflow-hidden">
              <CardHeader className="bg-secondary/5 border-b border-white/5 p-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Color Taxonomy</CardTitle>
                    <CardDescription>Assign core visual tokens for platform components.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Text variant="bodySmall" weight="bold">Primary Action Token</Text>
                        <Text variant="caption" className="text-muted-foreground">Used for CTAs and critical path nodes.</Text>
                      </div>
                      <div 
                        className="w-12 h-12 rounded-2xl shadow-xl border-2 border-white/10"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="colors.primary"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input type="color" {...field} className="w-12 h-12 p-1 bg-transparent border-none cursor-pointer p-0 overflow-hidden" />
                              <Input {...field} className="flex-1 bg-background/50 h-12 border-white/10 font-mono" placeholder="#000000" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Text variant="bodySmall" weight="bold">Secondary Accent Token</Text>
                        <Text variant="caption" className="text-muted-foreground">Used for validation badges and visual hierarchy.</Text>
                      </div>
                      <div 
                        className="w-12 h-12 rounded-2xl shadow-xl border-2 border-white/10"
                        style={{ backgroundColor: secondaryColor }}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="colors.secondary"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input type="color" {...field} className="w-12 h-12 p-1 bg-transparent border-none cursor-pointer p-0 overflow-hidden" />
                              <Input {...field} className="flex-1 bg-background/50 h-12 border-white/10 font-mono" placeholder="#000000" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Brand Preview & Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="glass-card border-none bg-primary/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Sparkles className="h-16 w-16 text-primary" />
              </div>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                  <ImageIcon className="h-4 w-4" /> Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="p-6 rounded-[2rem] bg-background/50 border border-white/5 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                      <Palette className="h-5 w-5" />
                    </div>
                    <div>
                      <Text variant="bodySmall" weight="bold">{form.watch('platformName') || 'Platform Name'}</Text>
                      <Text variant="caption" className="text-muted-foreground uppercase text-[8px] tracking-widest">Preview Mode</Text>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full h-10 rounded-xl font-bold text-xs" style={{ backgroundColor: primaryColor, color: '#fff' }}>
                      Primary Interaction
                    </Button>
                    <Badge variant="outline" className="w-full justify-center h-8 border-secondary/30 bg-secondary/5 uppercase font-bold text-[9px]" style={{ color: secondaryColor, borderColor: `${secondaryColor}40` }}>
                      Secondary Validator
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase mb-2">
                    <CheckCircle2 className="h-3 w-3" /> Visual Kernel Verified
                  </div>
                  <Text variant="caption" className="italic text-muted-foreground leading-relaxed">
                    "Preview utilizes current CSS variables. Changes will propagate across all 1M+ nodes upon cryptographic commit."
                  </Text>
                </div>
              </CardContent>
            </Card>

            <div className="p-8 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4 relative overflow-hidden group">
              <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <RefreshCcw className="h-32 w-32 text-secondary rotate-12" />
              </div>
              <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                <Info className="h-4 w-4" /> Branding Policy
              </div>
              <Text variant="caption" className="text-muted-foreground leading-relaxed">
                Visual shifts trigger a background re-validation of all **featured intelligence assets** to ensure contrast compliance and E-E-A-T visual standards.
              </Text>
              <Button variant="link" className="p-0 h-auto text-secondary text-xs font-bold" asChild>
                <Link href="/admin/control/audit-trail">Review Change History <ExternalLink className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
