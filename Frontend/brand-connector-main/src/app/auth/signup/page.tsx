'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Star, Rocket, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const ROLES = [
  {
    id: 'BRAND',
    title: 'I am a Brand',
    description: 'I want to hire creators and manage marketing campaigns.',
    icon: Building2,
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'hover:border-primary',
    path: '/auth/signup/brand',
    benefits: [
      'Access 10,000+ verified talent',
      'AI-powered performance matching',
      'Secure escrow payment system',
      'Real-time ROI analytics'
    ]
  },
  {
    id: 'CREATOR',
    title: 'I am a Creator',
    description: 'I want to collaborate with brands and grow my influence.',
    icon: Star,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'hover:border-orange-500',
    path: '/auth/signup/creator',
    benefits: [
      'Direct access to global brands',
      'Guaranteed instant payouts',
      'Professional portfolio builder',
      'AI-matched campaign invites'
    ]
  }
];

export default function SignUpSelectionPage() {
  const router = useRouter();

  const handleRoleSelect = (roleId: string, path: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('signup_role', roleId);
      router.push(path);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <Link href="/" className="flex items-center">
            <div className="bg-primary p-2 rounded-xl mr-2">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <span className="font-headline font-bold text-2xl tracking-tight">
              Baalvion <span className="text-primary">Connect</span>
            </span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-slate-900 tracking-tight">
            Join the future of marketing
          </h1>
          <p className="text-slate-500 max-w-md">
            Choose your account type to get started with the world's most advanced creator marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ROLES.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleRoleSelect(role.id, role.path)}
              className="cursor-pointer"
            >
              <Card className={`h-full border-2 transition-all duration-300 ${role.border} shadow-sm hover:shadow-xl bg-white overflow-hidden relative`}>
                <CardHeader className="space-y-4">
                  <div className={`${role.bg} ${role.color} w-16 h-16 rounded-2xl flex items-center justify-center`}>
                    <role.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">{role.title}</CardTitle>
                    <CardDescription className="text-slate-500 mt-2">
                      {role.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="h-px bg-slate-100 w-full" />
                  <ul className="space-y-3">
                    {role.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <CheckCircle2 className={`h-4 w-4 ${role.color} flex-shrink-0`} />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full h-12 rounded-xl font-bold group ${
                      role.id === 'BRAND' 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    Continue as {role.id === 'BRAND' ? 'Brand' : 'Creator'}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}