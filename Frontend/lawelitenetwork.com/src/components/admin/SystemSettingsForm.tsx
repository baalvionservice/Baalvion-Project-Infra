
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings2, 
  Save, 
  ShieldCheck, 
  IndianRupee, 
  Bell, 
  Zap,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * @fileOverview SystemSettingsForm
 * Global configuration portal for platform behavior and economics.
 */
export default function SystemSettingsForm() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings Synchronized",
      description: "Global system parameters have been updated across the network.",
    });
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Economic Controls */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-blue-600" /> Economic Ledger
            </CardTitle>
            <CardDescription className="text-[10px] italic">Configure marketplace commission and settlement thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Standard Commission (%)</Label>
              <Input type="number" defaultValue="20" className="h-11 border-slate-200 bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Elite Commission (%)</Label>
              <Input type="number" defaultValue="10" className="h-11 border-slate-200 bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Min Settlement (INR)</Label>
              <Input type="number" defaultValue="1000" className="h-11 border-slate-200 bg-white" />
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Platform Modules
            </CardTitle>
            <CardDescription className="text-[10px] italic">Manage active network capabilities and user access points.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-900">AI Intelligence Pulse</Label>
                <p className="text-[9px] text-slate-400 uppercase font-bold italic">Enable predictive analysis modules</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-900">E2E Secure Video</Label>
                <p className="text-[9px] text-slate-400 uppercase font-bold italic">Encrypted consultation protocol</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-900">Global Search Indexed</Label>
                <p className="text-[9px] text-slate-400 uppercase font-bold italic">Algolia search discovery sync</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" /> Regional Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Default Currency</Label>
              <Input defaultValue="INR" className="h-11 border-slate-200 bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Jurisdiction Policy</Label>
              <Input defaultValue="India - Central Statutes" className="h-11 border-slate-200 bg-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 opacity-40">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Protocol Version v4.2.0</p>
        </div>
        <Button onClick={handleSave} className="bg-[#0B1F3A] hover:bg-slate-800 text-white font-bold uppercase text-[10px] tracking-[0.2em] h-12 px-10 rounded-xl shadow-lg transition-all active:scale-95">
          <Save className="w-4 h-4 mr-2" /> Commit Global Settings
        </Button>
      </div>
    </div>
  );
}
