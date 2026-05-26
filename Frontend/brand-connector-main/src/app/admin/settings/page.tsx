'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  ShieldCheck,
  CreditCard,
  Zap,
  Mail,
  Key,
  Save,
  Loader2,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCcw,
  Globe,
  Bell,
  Smartphone,
  Eye,
  Info,
  Server,
  Star
} from 'lucide-react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { useFirestore, useDoc } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function PlatformSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // Fetch Global Settings
  const { data: settings, loading } = useDoc<any>('system/platform');

  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // Local Form State
  const [formData, setFormData] = useState<any>({
    platformName: 'Baalvion Connect',
    supportEmail: 'support@baalvion.com',
    fees: { starter: 5, growth: 3, enterprise: 2 },
    flags: { aiMatcher: true, instantPayouts: false, publicLeaderboard: true, registrationOpen: true },
    isMaintenanceMode: false
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleUpdateField = (path: string, value: any) => {
    const newData = { ...formData };
    const parts = path.split('.');
    let current = newData;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    setFormData(newData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const settingsRef = doc(db!, 'system', 'platform');

    // Pattern: Non-blocking mutation
    setDoc(settingsRef, { ...formData, updatedAt: new Date().toISOString() }, { merge: true })
      .then(() => {
        toast({ title: "System updated", description: "Global platform configuration synchronized." });
        setIsSaving(false);
      })
      .catch(async (err) => {
        errorEmitter.emitPermissionError(new FirestorePermissionError({
          path: settingsRef.path,
          operation: 'write',
          requestResourceData: formData
        }));
        setIsSaving(false);
      });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Platform Settings
          </h1>
          <p className="text-slate-500 font-medium">Control global variables, economics, and feature availability.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            disabled={isSaving}
            onClick={handleSave}
            className="rounded-xl font-black px-8 shadow-xl shadow-primary/20 h-12"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Platform Config
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-slate-100/50 rounded-2xl border mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <TabsTrigger value="general" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><Globe className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="fees" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><CreditCard className="h-4 w-4" /> Economics</TabsTrigger>
          <TabsTrigger value="flags" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><Zap className="h-4 w-4" /> Feature Flags</TabsTrigger>
          <TabsTrigger value="email" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><Mail className="h-4 w-4" /> Messaging</TabsTrigger>
          <TabsTrigger value="api" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><Key className="h-4 w-4" /> Developer</TabsTrigger>
          <TabsTrigger value="infrastructure" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><Server className="h-4 w-4" /> Infrastructure</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* GENERAL SETTINGS */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b bg-slate-50/50">
                      <CardTitle className="text-xl">Platform Identity</CardTitle>
                      <CardDescription>Core branding and contact information.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-700">Platform Name</Label>
                          <Input
                            value={formData.platformName}
                            onChange={(e) => handleUpdateField('platformName', e.target.value)}
                            className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-700">Admin Support Email</Label>
                          <Input
                            value={formData.supportEmail}
                            onChange={(e) => handleUpdateField('supportEmail', e.target.value)}
                            className="h-12 rounded-xl bg-slate-50 border-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-4 pt-4">
                        <Label className="font-bold text-slate-700">Platform Logo (SVG/PNG)</Label>
                        <div className="flex items-center gap-6">
                          <div className="h-20 w-20 rounded-2xl bg-primary/5 flex items-center justify-center border-2 border-dashed border-primary/20">
                            <Zap className="h-10 w-10 text-primary fill-primary" />
                          </div>
                          <Button variant="outline" className="rounded-xl font-bold border-slate-200 bg-white">Replace System Logo</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <ShieldCheck className="h-16 w-16" />
                    </div>
                    <CardContent className="p-8 space-y-6">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                        <Info className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black">Governance Note</h3>
                        <p className="text-slate-400 text-xs leading-relaxed font-medium">
                          System-wide changes are logged in the audit trail. Critical updates require a secondary admin signature in production.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* FEE CONFIGURATION */}
            <TabsContent value="fees" className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white max-w-3xl">
                <CardHeader className="p-8 border-b bg-slate-50/50">
                  <CardTitle className="text-xl">Marketplace Commission Logic</CardTitle>
                  <CardDescription>Default platform fees per subscription tier.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { id: 'starter', label: 'Starter Tier (%)' },
                      { id: 'growth', label: 'Growth Tier (%)' },
                      { id: 'enterprise', label: 'Enterprise Tier (%)' }
                    ].map((fee) => (
                      <div key={fee.id} className="space-y-3">
                        <Label className="font-black text-[10px] uppercase text-slate-400 tracking-widest">{fee.label}</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={formData.fees[fee.id]}
                            onChange={(e) => handleUpdateField(`fees.${fee.id}`, parseFloat(e.target.value) || 0)}
                            className="h-14 rounded-2xl bg-slate-50 border-none font-black text-2xl text-primary text-center pr-10"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 flex gap-4">
                    <Zap className="h-6 w-6 text-blue-500 shrink-0" />
                    <p className="text-sm text-blue-700 font-medium leading-relaxed">
                      Changes to commission rates will apply to all **new** milestones created after the configuration is saved.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FEATURE FLAGS */}
            <TabsContent value="flags" className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white max-w-3xl">
                <CardHeader className="p-8 border-b bg-slate-50/50">
                  <CardTitle className="text-xl">Dynamic Module Control</CardTitle>
                  <CardDescription>Enable or disable platform features without a new deployment.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-50">
                    {[
                      { id: 'aiMatcher', title: 'AI Matchmaking Engine', desc: 'Auto-pitch creators to brand campaigns.', icon: Zap },
                      { id: 'instantPayouts', title: 'Instant Withdrawals', desc: 'Bypass 48h clearing for Verified Pros.', icon: CreditCard },
                      { id: 'publicLeaderboard', title: 'Public Creator Ranking', desc: 'Show Hall of Fame to logged-out visitors.', icon: Star },
                      { id: 'registrationOpen', title: 'Marketplace Onboarding', desc: 'Allow new user signups.', icon: Building2 },
                    ].map((flag) => (
                      <div key={flag.id} className="p-8 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                            <flag.icon className="h-6 w-6 text-slate-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{flag.title}</h4>
                            <p className="text-xs text-slate-500 font-medium">{flag.desc}</p>
                          </div>
                        </div>
                        <Switch
                          checked={formData.flags[flag.id]}
                          onCheckedChange={(v) => handleUpdateField(`flags.${flag.id}`, v)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* EMAIL TEMPLATES */}
            <TabsContent value="email" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Template Editor</CardTitle>
                        <Select defaultValue="welcome_creator">
                          <SelectTrigger className="w-[220px] h-10 rounded-xl bg-white border-slate-200 font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="welcome_creator">Welcome (Creator)</SelectItem>
                            <SelectItem value="campaign_invite">Campaign Invitation</SelectItem>
                            <SelectItem value="payout_success">Payment Confirmation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="space-y-2">
                        <Label className="font-bold">Subject Line</Label>
                        <Input defaultValue="Welcome to Baalvion Connect, {{name}}! 🚀" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Email Body (HTML/Markdown)</Label>
                        <Textarea
                          placeholder="Write your email content here..."
                          className="min-h-[300px] rounded-2xl p-6 bg-slate-50 border-none resize-none font-mono text-xs"
                          defaultValue="Hi {{name}},\n\nWelcome to the premier marketplace for high-performance creative talent. Your profile is now being indexed by our AI..."
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="p-8 border-t bg-slate-50/50 flex justify-end gap-3">
                      <Button variant="ghost" className="rounded-xl font-bold">Preview Send</Button>
                      <Button variant="secondary" className="rounded-xl font-bold">Update Template</Button>
                    </CardFooter>
                  </Card>
                </div>
                <div className="lg:col-span-4 space-y-6">
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="p-6 border-b">
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Available Tags</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                      {[
                        { tag: '{{name}}', desc: 'Recipient Display Name' },
                        { tag: '{{campaign_title}}', desc: 'Related Project Name' },
                        { tag: '{{amount}}', desc: 'Transaction Value' },
                        { tag: '{{cta_link}}', desc: 'Primary Action URL' },
                      ].map((tag) => (
                        <div key={tag.tag} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                          <code className="text-[10px] font-black text-primary">{tag.tag}</code>
                          <span className="text-[10px] font-bold text-slate-400">{tag.desc}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* API KEYS (MOCK) */}
            <TabsContent value="api" className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white max-w-3xl">
                <CardHeader className="p-8 border-b bg-slate-50/50">
                  <CardTitle className="text-xl">System API Credentials</CardTitle>
                  <CardDescription>Secret keys for administrative platform-level integrations.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-6">
                    {[
                      { name: 'Analytics Sync Key', key: 'bv_sys_live_492837492837...', created: 'Jul 12, 2024' },
                      { name: 'Internal Messenger Secret', key: 'bv_sys_msg_901283901283...', created: 'Jun 05, 2024' },
                    ].map((key) => (
                      <div key={key.name} className="flex items-center justify-between p-6 rounded-2xl border-2 border-slate-50 bg-white group">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900">{key.name}</p>
                          <code className="text-xs text-slate-400 font-mono">{key.key}</code>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Issued: {key.created}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><RefreshCcw className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-400"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full h-12 rounded-xl font-bold bg-slate-900">
                    <Plus className="mr-2 h-4 w-4" /> Generate New Secret Key
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* INFRASTRUCTURE */}
            <TabsContent value="infrastructure" className="space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white max-w-3xl border-red-100 ring-4 ring-red-50">
                <CardHeader className="p-8 border-b bg-red-50/20">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <CardTitle className="text-xl text-red-900">Maintenance & State Control</CardTitle>
                  </div>
                  <CardDescription className="mt-2 text-red-700">Warning: These actions affect all users globally.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center justify-between p-8 rounded-[2rem] bg-red-50/50 border border-red-100">
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-red-900">Global Maintenance Mode</h4>
                      <p className="text-sm text-red-700 max-w-md">When enabled, all users (except admins) will be redirected to a maintenance page. Active campaign processing will pause.</p>
                    </div>
                    <Switch
                      checked={formData.isMaintenanceMode}
                      onCheckedChange={(v) => handleUpdateField('isMaintenanceMode', v)}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Services</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-600">Database Engine</span>
                          <Badge className="bg-emerald-100 text-emerald-600 border-none">OPERATIONAL</Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-600">File Storage</span>
                          <Badge className="bg-emerald-100 text-emerald-600 border-none">OPERATIONAL</Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-600">AI Matcher API</span>
                          <Badge className="bg-emerald-100 text-emerald-600 border-none">OPERATIONAL</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center space-y-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <RefreshCcw className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Purge Cache</p>
                        <p className="text-[10px] text-slate-400 font-medium">Clear system edge cache</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full rounded-lg font-bold">Execute Purge</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
