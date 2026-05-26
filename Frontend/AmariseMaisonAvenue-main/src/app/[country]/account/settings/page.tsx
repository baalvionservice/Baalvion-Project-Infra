'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { 
  ShieldCheck, 
  ChevronRight, 
  Lock, 
  User, 
  Mail, 
  Globe, 
  CheckCircle2, 
  AlertTriangle,
  Bell,
  Eye,
  Type,
  Palette
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function IdentitySettingsPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { currentUser, globalSettings } = useAppStore();

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
             <Link href={`/${countryCode}/account`}>Dashboard</Link>
             <ChevronRight className="w-2.5 h-2.5" />
             <span className="text-plum">Identity & Security</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">Institutional Identity</h1>
          <p className="text-sm text-gray-500 font-light italic">Manage your verified credentials and security protocols.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Core Profile Section */}
        <div className="lg:col-span-8 space-y-12">
           <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none p-12 space-y-10">
              <div className="flex items-center space-x-4 text-plum">
                 <User className="w-6 h-6" />
                 <h3 className="text-xl font-headline font-bold italic uppercase tracking-widest text-gray-900">Collector Profile</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Legal Name</Label>
                    <Input className="rounded-none border-slate-200 h-12 text-sm italic font-light" value={currentUser?.name} />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Correspondance Email</Label>
                    <Input className="rounded-none border-slate-200 h-12 text-sm italic font-light" value={currentUser?.email} />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Primary Hub</Label>
                    <div className="flex items-center space-x-4 p-4 bg-ivory border border-border">
                       <span className="text-xl">🇺🇸</span>
                       <span className="text-xs font-bold uppercase">USA Hub (NYC Flagship)</span>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Preferred Currency</Label>
                    <div className="flex items-center space-x-4 p-4 bg-ivory border border-border">
                       <span className="text-xl">$</span>
                       <span className="text-xs font-bold uppercase">USD • US Dollar</span>
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-border flex justify-end">
                 <Button className="rounded-none bg-black text-white hover:bg-plum h-12 px-12 text-[10px] font-bold uppercase tracking-widest transition-all">
                    UPDATE REGISTRY
                 </Button>
              </div>
           </Card>

           <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none p-12 space-y-10">
              <div className="flex items-center space-x-4 text-plum">
                 <Bell className="w-6 h-6" />
                 <h3 className="text-xl font-headline font-bold italic uppercase tracking-widest text-gray-900">Engagement Protocols</h3>
              </div>
              
              <div className="space-y-8">
                 <ProtocolRow label="Private Salon Invitations" desc="Receive discreet notifications for high-value artifact releases." />
                 <ProtocolRow label="Market Resonance Reports" desc="Weekly intelligence on collection appreciation trajectories." />
                 <ProtocolRow label="End-to-End Encryption" desc="Enforce institutional security for all curatorial dialogues." enabled />
              </div>
           </Card>
        </div>

        {/* Verification Status Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
           <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><ShieldCheck className="w-32 h-32" /></div>
              <div className="space-y-4">
                 <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Institutional Compliance</h4>
                 <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-white/60 tracking-widest">Verification Tier</span>
                    <Badge className="bg-green-500 text-white border-none text-[8px] uppercase tracking-tighter">Level 3 Secure</Badge>
                 </div>
              </div>
              <p className="text-xs font-light italic leading-relaxed opacity-70">
                "Your identity has been verified against the Maison's global compliance standards. You have absolute access to the private registry."
              </p>
              <div className="space-y-4 pt-4 border-t border-white/10">
                 <div className="flex items-center space-x-3 text-gold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">AML Screened</span>
                 </div>
                 <div className="flex items-center space-x-3 text-gold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">KYC Authenticated</span>
                 </div>
              </div>
           </Card>

           <Card className="bg-red-50/30 border-red-100 p-8 space-y-6 shadow-sm">
              <div className="flex items-center space-x-3 text-red-600">
                 <AlertTriangle className="w-5 h-5" />
                 <h4 className="text-[10px] font-bold uppercase tracking-widest">Security Advisory</h4>
              </div>
              <p className="text-[11px] text-gray-500 italic leading-relaxed">
                Your 2FA protocol is currently using email verification. We recommend upgrading to a hardware key for institutional-tier security.
              </p>
              <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 h-10 rounded-none text-[9px] font-bold uppercase tracking-widest">
                 UPGRADE SECURITY
              </Button>
           </Card>
        </aside>
      </div>
    </div>
  );
}

function ProtocolRow({ label, desc, enabled = false }: { label: string, desc: string, enabled?: boolean }) {
  return (
    <div className="flex items-center justify-between group">
       <div className="space-y-1">
          <p className="text-sm font-bold uppercase tracking-tight text-gray-900 group-hover:text-plum transition-colors">{label}</p>
          <p className="text-xs text-gray-400 font-light italic">{desc}</p>
       </div>
       <Switch defaultChecked={enabled} className="data-[state=checked]:bg-plum" />
    </div>
  );
}
