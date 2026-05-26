'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  ShieldCheck, 
  CreditCard, 
  FileText, 
  Bell, 
  Zap, 
  Globe, 
  Instagram, 
  Twitter, 
  Linkedin, 
  CheckCircle2, 
  Loader2, 
  Save, 
  Plus, 
  Trash2, 
  Lock, 
  Eye, 
  EyeOff, 
  Upload,
  Info,
  Smartphone,
  Star,
  FileCheck,
  ChevronRight,
  IndianRupee,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { BrandProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui';

export default function BrandSettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const brandId = currentUser?.id ? `brand_${currentUser.id}` : null;
  const { data: brand, loading: brandLoading } = useDoc<BrandProfile>(brandId ? `brands/${brandId}` : null);

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form States
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [socials, setSocials] = useState({ instagram: '', twitter: '', linkedin: '' });
  const [defaultTemplate, setDefaultTemplate] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('INR');

  useEffect(() => {
    if (brand) {
      setCompanyName(brand.companyName || '');
      setDescription(brand.brandGuidelines || '');
      setWebsite(brand.website || '');
      setGstNumber(brand.gstNumber || '');
      setBillingAddress(brand.billingAddress || '');
      setDefaultTemplate(brand.defaultBriefTemplate || '');
      setPreferredCurrency(brand.currency || 'INR');
    }
  }, [brand]);

  const handleSaveSettings = async () => {
    if (!brandId) return;
    setIsSaving(true);

    const updateData = {
      companyName,
      brandGuidelines: description,
      website,
      gstNumber,
      billingAddress,
      socialLinks: socials,
      defaultBriefTemplate: defaultTemplate,
      currency: preferredCurrency,
      updatedAt: new Date().toISOString()
    };

    updateDoc(doc(db!, 'brands', brandId), updateData)
      .then(() => {
        toast({ title: "Settings updated", description: "Your brand profile has been synchronized." });
        setIsSaving(false);
      })
      .catch(async (err) => {
        errorEmitter.emitPermissionError(new FirestorePermissionError({
          path: `/brands/${brandId}`,
          operation: 'update',
          requestResourceData: updateData
        }));
        setIsSaving(false);
      });
  };

  if (authLoading || brandLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Brand Settings</h1>
          <p className="text-slate-500 font-medium">Manage your corporate identity, fiscal details, and platform integration.</p>
        </div>
        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving}
          className="rounded-xl font-bold px-8 shadow-xl shadow-primary/20 h-12"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Apply Changes
        </Button>
      </div>

      <Tabs defaultValue="profile" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-slate-100/50 rounded-2xl border mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <TabsTrigger value="profile" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><Globe className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="verification" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><ShieldCheck className="h-4 w-4" /> Verification</TabsTrigger>
          <TabsTrigger value="payment" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><CreditCard className="h-4 w-4" /> Billing & GST</TabsTrigger>
          <TabsTrigger value="defaults" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><FileText className="h-4 w-4" /> Campaign Defaults</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="api" className="rounded-xl py-2.5 px-6 font-bold flex gap-2"><Zap className="h-4 w-4" /> API Access</TabsTrigger>
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
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b bg-slate-50/50">
                      <CardTitle className="text-xl">Platform Identity</CardTitle>
                      <CardDescription>Core branding and contact information.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                          <Avatar className="h-28 w-28 border-4 border-white shadow-xl rounded-2xl">
                            <AvatarImage src={brand?.logoUrl || `https://picsum.photos/seed/${brand?.id}/200`} />
                            <AvatarFallback className="text-2xl font-black bg-primary/5 text-primary">{companyName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <button className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">{companyName}</h3>
                            {brand?.verificationStatus === 'VERIFIED' && <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500/10" />}
                          </div>
                          <p className="text-sm text-slate-400 font-medium">Industry: {brand?.industry}</p>
                          <Button variant="outline" size="sm" className="rounded-lg font-bold h-9">Replace Logo</Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-700">Company Legal Name</Label>
                          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-700">Official Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="pl-10 h-12 rounded-xl bg-slate-50 border-none" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Display Currency</Label>
                        <Select value={preferredCurrency} onValueChange={setPreferredCurrency}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                            <SelectValue placeholder="Select Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_CURRENCIES.map(curr => (
                              <SelectItem key={curr.code} value={curr.code} className="font-bold">
                                {curr.code} - {curr.name} ({curr.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Brand Story & Description</Label>
                        <Textarea 
                          value={description} 
                          onChange={(e) => setDescription(e.target.value)} 
                          placeholder="Tell creators what your brand stands for..." 
                          className="min-h-[150px] rounded-2xl p-6 bg-slate-50 border-none resize-none"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="font-bold text-slate-700">Social Presence</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="relative">
                            <Instagram className="absolute left-3 top-3 h-4 w-4 text-pink-600" />
                            <Input value={socials.instagram} onChange={(e) => setSocials({...socials, instagram: e.target.value})} placeholder="@instagram" className="pl-10 rounded-xl bg-slate-50 border-none h-10" />
                          </div>
                          <div className="relative">
                            <Twitter className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                            <Input value={socials.twitter} onChange={(e) => setSocials({...socials, twitter: e.target.value})} placeholder="@twitter" className="pl-10 rounded-xl bg-slate-50 border-none h-10" />
                          </div>
                          <div className="relative">
                            <Linkedin className="absolute left-3 top-3 h-4 w-4 text-blue-700" />
                            <Input value={socials.linkedin} onChange={(e) => setSocials({...socials, linkedin: e.target.value})} placeholder="linkedin.com/..." className="pl-10 rounded-xl bg-slate-50 border-none h-10" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-slate-900 text-white">
                    <CardContent className="p-8 space-y-6">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                        <Star className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black">Professional Plan</h3>
                        <p className="text-xs text-slate-400 font-medium">Your current plan is <strong>{brand?.plan}</strong>. You have 3 seats remaining.</p>
                      </div>
                      <Button variant="secondary" className="w-full rounded-xl font-black h-11 text-[10px] uppercase tracking-widest">
                        Manage Subscription
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="verification" className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white max-w-3xl">
                <CardHeader className="p-8 border-b bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-blue-500" />
                    <CardTitle className="text-xl">Brand Verification</CardTitle>
                  </div>
                  <CardDescription className="mt-2">Verified brands see 40% higher creator application rates.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center justify-between p-6 rounded-2xl border-2 border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <FileCheck className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Certificate of Incorporation</p>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-tighter">Required Document</p>
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-lg h-9 font-bold bg-white border-slate-200">
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white max-w-3xl">
                <CardHeader className="border-b bg-slate-50/50 p-8">
                  <CardTitle className="text-xl">Push & Email Alerts</CardTitle>
                  <CardDescription>Granular control over how we communicate with you.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-50">
                    {[
                      { id: 'apps', title: 'New Applications', desc: 'Alert me when a high-match creator applies.', icon: Users },
                      { id: 'milestones', title: 'Milestone Submissions', desc: 'Notification when work is ready for review.', icon: FileCheck },
                      { id: 'wallet', title: 'Wallet & Escrow', desc: 'Alerts for fund holds and successful releases.', icon: IndianRupee },
                      { id: 'marketing', title: 'Product Updates', desc: 'Marketplace trends and feature announcements.', icon: Zap },
                    ].map((pref) => (
                      <div key={pref.id} className="p-8 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                            <pref.icon className="h-6 w-6 text-slate-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{pref.title}</h4>
                            <p className="text-xs text-slate-500 font-medium">{pref.desc}</p>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    ))}
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