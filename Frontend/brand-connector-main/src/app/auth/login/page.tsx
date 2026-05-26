'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Rocket, ShieldCheck, Building2, UserCircle2, Zap, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { signInAs } = useAuth();

  const handleRoleSelect = (role: 'ADMIN' | 'BRAND' | 'CREATOR') => {
    signInAs(role);
    if (role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push(`/dashboard/${role.toLowerCase()}`);
    }
  };

  const ROLES = [
    {
      id: 'ADMIN',
      title: 'Super Admin',
      desc: 'Platform control, revenue, and user directory.',
      icon: ShieldCheck,
      color: 'bg-slate-900 text-white',
      path: '/admin'
    },
    {
      id: 'BRAND',
      title: 'Brand Portal',
      desc: 'Hire creators and manage campaign ROI.',
      icon: Building2,
      color: 'bg-primary text-white',
      path: '/dashboard/brand'
    },
    {
      id: 'CREATOR',
      title: 'Creator Studio',
      desc: 'Build portfolio and apply to brand deals.',
      icon: Star,
      color: 'bg-orange-600 text-white',
      path: '/dashboard/creator'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-2xl space-y-8 z-10">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center mb-6">
            <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/20">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <span className="font-headline font-bold text-3xl tracking-tight ml-3">
              Baalvion <span className="text-primary">Connect</span>
            </span>
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Select Workspace</h1>
          <p className="text-slate-500 mt-2 text-lg">Choose an entry point to explore the platform modules.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLES.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card 
                className="h-full border-none shadow-xl hover:shadow-2xl transition-all cursor-pointer group rounded-[2rem] overflow-hidden bg-white"
                onClick={() => handleRoleSelect(role.id as any)}
              >
                <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                  <div className={cn(
                    "h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500",
                    role.color
                  )}>
                    <role.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{role.title}</h3>
                    <p className="text-xs font-medium text-slate-400 mt-2 leading-relaxed">
                      {role.desc}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full h-10 w-10 p-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
          <CardContent className="p-0 flex items-center justify-center gap-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">
              Mock session active. Authentication bypassed for demo.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-8 text-[10px] text-slate-400 font-black uppercase tracking-widest">
          <Link href="/status" className="hover:text-primary">System Status</Link>
          <Link href="/leaderboard" className="hover:text-primary">Leaderboard</Link>
          <Link href="/pricing" className="hover:text-primary">Public Pricing</Link>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
