"use client"

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Zap, ShoppingBag, GraduationCap, Lock, Terminal, Copy, ArrowRight } from 'lucide-react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DEMO_ACCOUNTS = [
  {
    role: "Super Admin",
    icon: ShieldAlert,
    color: "text-semantic-error",
    bg: "bg-semantic-error/5",
    link: "/admin",
    email: "superadmin@marketunderworld.com",
    pass: "Admin@123",
    desc: "Full platform command center with level 5 clearance. Monitor all regional nodes and transactions."
  },
  {
    role: "Teacher Admin",
    icon: Zap,
    color: "text-semantic-warning",
    bg: "bg-semantic-warning/5",
    link: "/teacher-dashboard",
    email: "teacher1@marketunderworld.com",
    pass: "Teacher@123",
    desc: "Operator terminal for running live broadcasts, promoting items, and generating secret codes."
  },
  {
    role: "Seller Panel",
    icon: ShoppingBag,
    color: "text-brand-green",
    bg: "bg-brand-green/5",
    link: "/seller-dashboard",
    email: "seller1@marketunderworld.com",
    pass: "Seller@123",
    desc: "Merchant portal for inventory control, order fulfillment, and regional distribution tracking."
  },
  {
    role: "Student Dashboard",
    icon: GraduationCap,
    color: "text-semantic-info",
    bg: "bg-semantic-info/5",
    link: "/student-dashboard",
    email: "student1@marketunderworld.com",
    pass: "Student@123",
    desc: "Learner hub for accessing live sessions, utilizing discount protocols, and wallet management."
  }
];

export default function DemoAccessPage() {
  const { toast } = useToast();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Credentials Copied",
      description: "Paste into the sign-in fields to proceed.",
    });
  };

  return (
    <div className="min-h-screen bg-brand-base text-text-primary pt-44 pb-32">
      <div className="container max-w-6xl mx-auto px-6">
        <header className="mb-20 text-center space-y-6">
          <Badge variant="warning" className="px-4 py-1">UNAUTHORIZED ACCESS TERMINAL</Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase italic font-display">
            Demo <span className="text-semantic-warning">Control Hub.</span>
          </h1>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto font-mono uppercase text-sm tracking-widest">
            Select a node identity to bypass standard protocols. All credentials are pre-verified for demo purposes.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {DEMO_ACCOUNTS.map((acc, i) => (
            <ListingCard key={acc.role} index={i} className="bg-brand-surface border-brand-border p-10 group relative overflow-hidden">
              <div className={cn("absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center", acc.color)}>
                <acc.icon size={200} />
              </div>
              
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className={cn("p-4 rounded bg-brand-void border border-brand-border", acc.color)}>
                    <acc.icon className="w-8 h-8" />
                  </div>
                  <Link href="/auth/signin">
                    <AppButton variant="secondary" size="sm" className="font-mono text-[10px] uppercase">
                      Enter Terminal <ArrowRight className="ml-2 w-3 h-3" />
                    </AppButton>
                  </Link>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold uppercase italic">{acc.role}</h3>
                  <p className="text-sm text-text-muted leading-relaxed font-mono">{acc.desc}</p>
                </div>

                <div className="space-y-4 p-6 bg-brand-void rounded border border-brand-border">
                  <div className="flex justify-between items-center group/field">
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-text-ghost uppercase">Identity Email</div>
                      <div className="text-sm font-mono text-white">{acc.email}</div>
                    </div>
                    <button onClick={() => handleCopy(acc.email)} className="p-2 text-text-ghost hover:text-brand-green transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-px bg-brand-border" />
                  <div className="flex justify-between items-center group/field">
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-text-ghost uppercase">Security Key</div>
                      <div className="text-sm font-mono text-white">{acc.pass}</div>
                    </div>
                    <button onClick={() => handleCopy(acc.pass)} className="p-2 text-text-ghost hover:text-brand-green transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </ListingCard>
          ))}
        </div>

        <footer className="mt-20 pt-12 border-t border-brand-border flex items-center justify-center gap-4 text-text-ghost">
          <Lock className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">SECURE DEMO MODE ENABLED • V2.4.0</span>
        </footer>
      </div>
    </div>
  );
}