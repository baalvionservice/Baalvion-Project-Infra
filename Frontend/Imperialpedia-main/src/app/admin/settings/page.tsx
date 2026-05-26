"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/design-system/typography/text";
import {
  Settings,
  ShieldCheck,
  Zap,
  Palette,
  Bell,
  Save,
  Loader2,
  RefreshCw,
  Lock,
  Search,
  Globe,
  Info,
  Layout,
  Share2,
  Terminal,
  Cpu,
} from "lucide-react";
import { adminKernel } from "@/lib/services/admin-service";
import { SystemConfig } from "@/types/admin-system";
import { toast } from "@/hooks/use-toast";

export default function PlatformSettingsHub() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("platform");

  useEffect(() => {
    setConfig(adminKernel.getConfig());
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    adminKernel.updateConfig(config);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast({
      title: "Rules Synchronized",
      description: "Global kernel logic has been committed to all clusters.",
    });
  };

  if (!config) return null;

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Settings className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Kernel Logic
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            System Configuration
          </Text>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Commit Global State
        </Button>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="bg-card/30 border border-white/5 p-1 h-12 rounded-2xl w-full lg:w-auto justify-start">
          <TabsTrigger
            value="platform"
            className="px-6 h-10 gap-2 rounded-xl font-bold text-xs"
          >
            <Layout size={14} /> Platform
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="px-6 h-10 gap-2 rounded-xl font-bold text-xs"
          >
            <Share2 size={14} /> Integrations
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="px-6 h-10 gap-2 rounded-xl font-bold text-xs"
          >
            <Lock size={14} /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="mt-0 outline-none space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-10">
              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Layout size={20} />
                  </div>
                  <div>
                    <CardTitle>Identity Matrix</CardTitle>
                    <CardDescription>
                      Manage core semantic markers and branding tokens.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Platform Label
                      </Label>
                      <Input
                        value={config.siteName}
                        onChange={(e) =>
                          setConfig({ ...config, siteName: e.target.value })
                        }
                        className="bg-background/50 h-12 border-white/5 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Dispatch Node (Email)
                      </Label>
                      <Input
                        value={config.contactEmail}
                        onChange={(e) =>
                          setConfig({ ...config, contactEmail: e.target.value })
                        }
                        className="bg-background/50 h-12 border-white/5 font-mono text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-secondary/5 border-b border-white/5 p-8 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
                    <Palette size={20} />
                  </div>
                  <div>
                    <CardTitle>Branding Studio</CardTitle>
                    <CardDescription>
                      Configure primary color tokens and institutional assets.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Primary Accent Color
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.branding.primaryColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: {
                                ...config.branding,
                                primaryColor: e.target.value,
                              },
                            })
                          }
                          className="w-12 h-12 p-1 bg-transparent border-none cursor-pointer"
                        />
                        <Input
                          value={config.branding.primaryColor}
                          className="flex-1 bg-background/50 h-12 border-white/5 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Logo Vector URL
                      </Label>
                      <Input
                        value={config.branding.logoUrl}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            branding: {
                              ...config.branding,
                              logoUrl: e.target.value,
                            },
                          })
                        }
                        className="bg-background/50 h-12 border-white/5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <Card className="glass-card border-none shadow-xl bg-card/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                    <Zap className="h-4 w-4" /> Feature Studio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { label: "AI Drafting Assistant", key: "aiDrafting" },
                    { label: "pSEO Auto-Linking", key: "autoLinking" },
                    { label: "Real-time Market Data", key: "realTimeMarket" },
                  ].map((gate) => (
                    <div
                      key={gate.key}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <Text
                        variant="caption"
                        className="font-bold text-foreground/80"
                      >
                        {gate.label}
                      </Text>
                      <Switch
                        checked={(config.features as any)[gate.key]}
                        onCheckedChange={(val) =>
                          setConfig({
                            ...config,
                            features: { ...config.features, [gate.key]: val },
                          })
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="p-8 rounded-[3rem] bg-primary/5 border border-primary/20 space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                  <Lock className="h-16 w-16 text-primary rotate-12" />
                </div>
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4" /> Governance Note
                </div>
                <Text
                  variant="caption"
                  className="text-muted-foreground leading-relaxed italic block"
                >
                  "Committing global state changes will trigger a background
                  re-validation of all **1.2M+ intelligence nodes** across the
                  delivery network."
                </Text>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8">
              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
                    <Share2 size={20} />
                  </div>
                  <div>
                    <CardTitle>External Telemetry Nodes</CardTitle>
                    <CardDescription>
                      Manage cryptographic handshakes with Google and
                      third-party data providers.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                        <Terminal className="h-3.5 w-3.5" /> Google Analytics
                        Matrix
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            GA Tracking ID (G-XXXXX)
                          </Label>
                          <Input
                            placeholder="G-IMP-INDEX-42"
                            className="bg-background/50 h-12 border-white/10 font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Measurement API Secret
                          </Label>
                          <Input
                            type="password"
                            placeholder="••••••••••••••••"
                            className="bg-background/50 h-12 border-white/10 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-8 border-t border-white/5">
                      <div className="flex items-center gap-2 text-secondary font-bold text-[10px] uppercase tracking-widest">
                        <Search className="h-3.5 w-3.5" /> Search Console
                        Integration
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Authorized Site URL
                        </Label>
                        <Input
                          placeholder="https://imperialpedia.com"
                          className="bg-background/50 h-12 border-white/10 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-8 bg-muted/10 border-t border-white/5">
                  <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <Text
                      variant="caption"
                      className="text-muted-foreground italic leading-relaxed"
                    >
                      "Connecting these nodes allows the **Analytics Dashboard**
                      to ingest real-time visitor telemetry and crawl health
                      data."
                    </Text>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <Card className="glass-card border-none bg-secondary/5 p-8 relative overflow-hidden group h-fit">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Cpu className="h-24 w-24 text-secondary" />
                </div>
                <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest mb-4">
                  <RefreshCw className="h-4 w-4" /> Data Pipeline
                </div>
                <Text
                  variant="caption"
                  className="text-muted-foreground leading-relaxed"
                >
                  Platform telemetry is synchronized every **15 minutes**.
                  High-impact discovery anomalies trigger an immediate dispatch
                  to the Governance alerting node.
                </Text>
              </Card>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-0 outline-none">
          <Card className="glass-card border-none p-12 text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <Text variant="h3" className="mb-2">
              Security Hardening active
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground max-w-sm mx-auto"
            >
              Access to core security nodes is restricted to **Root
              Administrators**. Multi-factor handshake required for traversal.
            </Text>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
