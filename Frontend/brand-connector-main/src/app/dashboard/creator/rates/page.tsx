'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IndianRupee,
  Plus,
  Trash2,
  Save,
  Eye,
  Info,
  Sparkles,
  Instagram,
  Youtube,
  Music2,
  Twitter,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package,
  PlusCircle,
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { CreatorProfile, PackageDeal } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: 'text-slate-900' },
  { id: 'x', name: 'X (Twitter)', icon: Twitter, color: 'text-blue-400' },
];

const CONTENT_TYPES = [
  { id: 'story', name: 'Story' },
  { id: 'reel', name: 'Reel/Short' },
  { id: 'post', name: 'Main Post' },
  { id: 'video', name: 'Dedicated Video' },
];

export default function RateCardBuilderPage() {
  const { currentUser } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const creatorId = currentUser?.id ? `creator_${currentUser.id}` : null;
  const { data: creator, loading } = useDoc<CreatorProfile>(
    creatorId ? `creators/${creatorId}` : null
  );

  const [baseRates, setBaseRates] = useState<Record<string, number>>({});
  const [packages, setPackages] = useState<PackageDeal[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (creator) {
      setBaseRates(creator.baseRates || {});
      setPackages(creator.packages || []);
    }
  }, [creator]);

  const handleRateChange = (platform: string, type: string, value: string) => {
    const key = `${platform}_${type}`;
    const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    setBaseRates(prev => ({ ...prev, [key]: numValue }));
  };

  const addPackage = () => {
    const newPackage: PackageDeal = {
      id: Math.random().toString(36).substring(7),
      title: 'New Package',
      description: 'Describe what is included in this bundle.',
      price: 0,
      deliverables: ['1 Reel', '2 Stories']
    };
    setPackages(prev => [...prev, newPackage]);
  };

  const updatePackage = (id: string, updates: Partial<PackageDeal>) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePackage = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = async () => {
    if (!creatorId) return;
    setIsSaving(true);

    const updateData = {
      baseRates,
      packages,
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db!, 'creators', creatorId), updateData);
      toast({ title: "Rate card saved", description: "Your profile pricing has been updated." });
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `/creators/${creatorId}`,
        operation: 'update',
        requestResourceData: updateData
      }));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Rate Card Builder</h1>
            <p className="text-slate-500 mt-1">Define your commercial value across platforms and create enticing package deals.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl font-bold bg-white" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="mr-2 h-4 w-4" /> Preview Brand View
            </Button>
            <Button
              disabled={isSaving}
              onClick={handleSave}
              className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20 h-11"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Rate Card
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Pricing Table */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
              <CardHeader className="p-8 border-b bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Standard Base Rates</CardTitle>
                    <CardDescription>Your starting price for individual content units.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-widest border border-primary/10">
                    <Sparkles className="h-3 w-3" /> AI Market Pricing Active
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="w-[200px] pl-8 h-14 font-black text-[10px] uppercase tracking-widest text-slate-400">Platform</TableHead>
                      {CONTENT_TYPES.map(type => (
                        <TableHead key={type.id} className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">{type.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PLATFORMS.map((platform) => (
                      <TableRow key={platform.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <TableCell className="pl-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                              <platform.icon className={cn("h-5 w-5", platform.color)} />
                            </div>
                            <span className="font-bold text-slate-900">{platform.name}</span>
                          </div>
                        </TableCell>
                        {CONTENT_TYPES.map(type => {
                          const key = `${platform.id}_${type.id}`;
                          return (
                            <TableCell key={type.id} className="text-center px-4">
                              <div className="relative group">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                <Input
                                  value={baseRates[key] ? baseRates[key].toLocaleString() : ''}
                                  onChange={(e) => handleRateChange(platform.id, type.id, e.target.value)}
                                  placeholder="0"
                                  className="h-11 pl-8 text-center rounded-xl bg-slate-50/50 border-transparent hover:border-slate-200 focus:bg-white focus:border-primary transition-all font-bold"
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="p-6 bg-slate-50/30 border-t flex justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" /> These are base rates. You can always negotiate during application.
                </p>
              </CardFooter>
            </Card>

            {/* Package Deals Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Package Deals</h2>
                </div>
                <Button variant="secondary" className="rounded-xl font-bold h-10 px-6 gap-2" onClick={addPackage}>
                  <PlusCircle className="h-4 w-4" /> Add Package
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {packages.map((pkg, idx) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      layout
                    >
                      <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
                        <CardContent className="p-8 space-y-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-4">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Package Name</Label>
                                <Input
                                  value={pkg.title}
                                  onChange={(e) => updatePackage(pkg.id, { title: e.target.value })}
                                  className="h-11 rounded-xl bg-slate-50 border-none font-bold text-lg focus-visible:ring-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</Label>
                                <Input
                                  value={pkg.description}
                                  onChange={(e) => updatePackage(pkg.id, { description: e.target.value })}
                                  className="h-11 rounded-xl bg-slate-50 border-none text-sm text-slate-500 font-medium"
                                />
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 rounded-full" onClick={() => removePackage(pkg.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <Separator className="opacity-50" />

                          <div className="flex items-end gap-4">
                            <div className="flex-1 space-y-1">
                              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Package Price</Label>
                              <div className="relative group">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary" />
                                <Input
                                  value={pkg.price.toLocaleString()}
                                  onChange={(e) => updatePackage(pkg.id, { price: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                                  className="h-12 pl-10 rounded-xl bg-primary/5 border-none text-xl font-black text-primary"
                                />
                              </div>
                            </div>
                            <Badge className="h-6 bg-emerald-100 text-emerald-600 border-none font-black text-[9px] uppercase tracking-tighter self-center mt-6">
                              Best Value
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Insights & Quick Tips */}
          <aside className="lg:col-span-4 space-y-8">
            <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-indigo-700 text-white">
              <CardContent className="p-8 space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="h-6 w-6 text-yellow-300 fill-yellow-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black">AI Insights: Pricing</h3>
                  <p className="text-white/80 text-sm leading-relaxed font-medium">
                    Creators in your niche with similar reach typically charge <strong>₹12,500 - ₹18,000</strong> for high-quality Instagram Reels.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <p className="text-xs font-bold leading-relaxed">
                    Tip: Offering a "3-Post Bundle" at a 15% discount can increase your average booking value by 2.4x.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Pricing Checklist</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {[
                  { label: 'Set at least 3 platform rates', checked: Object.keys(baseRates).length >= 3 },
                  { label: 'Create 1 high-value package', checked: packages.length >= 1 },
                  { label: 'Link YouTube for long-form rates', checked: true },
                  { label: 'Market comparison audit', checked: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
                    {item.checked ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-100" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
              <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 uppercase">Live Pricing Sync</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1">
                  All changes made here are instantly pushed to the public pricing page and brand upgrade workflows.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-50 p-12 overflow-y-auto max-h-[90vh]">
            <div className="max-w-2xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-[2rem] bg-white shadow-xl flex items-center justify-center">
                  <IndianRupee className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Official Rate Card</h2>
                <p className="text-slate-500 font-medium">Verified creator rates for @{creator?.username || 'user'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLATFORMS.map(platform => {
                  const platformRates = Object.entries(baseRates)
                    .filter(([key]) => key.startsWith(platform.id))
                    .map(([key, val]) => ({ type: key.split('_')[1], val }));

                  if (platformRates.length === 0) return null;

                  return (
                    <Card key={platform.id} className="border-none shadow-sm rounded-3xl bg-white p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                          <platform.icon className={cn("h-5 w-5", platform.color)} />
                        </div>
                        <h4 className="font-black text-slate-900 uppercase tracking-widest">{platform.name}</h4>
                      </div>
                      <div className="space-y-4">
                        {platformRates.map(r => (
                          <div key={r.type} className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-500 capitalize">{r.type} Content</span>
                            <span className="text-md font-black text-slate-900">₹{r.val.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {packages.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" /> Premium Bundles
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {packages.map(pkg => (
                      <Card key={pkg.id} className="border-none shadow-md rounded-[2.5rem] bg-white p-8 group hover:bg-primary transition-all">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-xl font-black group-hover:text-white transition-colors">{pkg.title}</h4>
                            <p className="text-sm font-medium text-slate-500 group-hover:text-white/70 transition-colors">{pkg.description}</p>
                            <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                              {pkg.deliverables.map((d, i) => (
                                <Badge key={i} variant="secondary" className="rounded-full bg-slate-100 group-hover:bg-white/20 group-hover:text-white border-none font-bold text-[9px] px-2 h-5">{d}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-center md:text-right">
                            <p className="text-3xl font-black group-hover:text-white transition-colors text-primary">₹{pkg.price.toLocaleString()}</p>
                            <Button className="mt-4 rounded-xl font-bold bg-slate-900 group-hover:bg-white group-hover:text-primary transition-all h-10 px-8">Book Package</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <h4 className="text-lg font-bold text-emerald-900">Escrow Protected Payments</h4>
                <p className="text-xs text-emerald-700 font-medium max-w-sm">
                  Funds are held securely by Baalvion Connect and released only after your approval of the final content.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}