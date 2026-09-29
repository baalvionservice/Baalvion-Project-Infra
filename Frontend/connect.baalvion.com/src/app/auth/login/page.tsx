'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Rocket, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail } = useAuth();

  // Primary email + password auth (wired to the real Firebase + JWT login in AuthContext).
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      router.push('/dashboard/brand');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 mt-2 text-lg">Sign in to your account to continue.</p>
        </div>

        {/* Email + password — primary auth path */}
        <Card className="border-none shadow-xl rounded-[2rem] bg-white max-w-md mx-auto">
          <CardContent className="p-8">
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="pl-9 h-12 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9 h-12 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {formError && (
                <p className="text-sm font-medium text-red-600" role="alert">{formError}</p>
              )}
              <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
            <p className="text-center text-sm text-slate-500 mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-primary font-bold hover:underline">
                Sign up
              </Link>
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
