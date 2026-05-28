'use client';

import { useAuth } from '@/contexts/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, User, Briefcase, Shield, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/lib/mock-data';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Primary email + password auth (wired to the real auth context).
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsEmailSubmitting(true);
    const result = await login({ email, password });
    if (!result.success) {
      toast({
        title: 'Login Failed',
        description: result.message || 'Invalid email or password.',
        variant: 'destructive',
      });
    }
    // On success the auth context handles redirection.
    setIsEmailSubmitting(false);
  };

  const handleLogin = async (role: 'candidate' | 'company' | 'admin') => {
    setIsSubmitting(role);
    const userToLogin = mockUsers.find((u) => u.role === role);

    if (userToLogin) {
      // In a real app, you'd send email/password. Here we just find the first user of that role.
      const result = await login({ email: userToLogin.email, password: 'password' });
      if (!result.success) {
        toast({
          title: 'Login Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
      // On success, auth context handles redirection
    } else {
      toast({
        title: 'Login Failed',
        description: `No mock user found for role: ${role}.`,
        variant: 'destructive',
      });
    }
    setIsSubmitting(null);
  };

  return (
    <div className="container flex h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email + password — primary auth path */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isEmailSubmitting}>
              {isEmailSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          {/* Quick demo login — preserves the original role-based mock entry points */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or quick demo login</span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleLogin('candidate')}
            disabled={!!isSubmitting}
          >
            {isSubmitting === 'candidate' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <User className="mr-2 h-4 w-4" />
            )}
            Log in as Candidate
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleLogin('company')}
            disabled={!!isSubmitting}
          >
            {isSubmitting === 'company' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Briefcase className="mr-2 h-4 w-4" />
            )}
            Log in as Company
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleLogin('admin')}
            disabled={!!isSubmitting}
          >
            {isSubmitting === 'admin' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            Log in as Admin
          </Button>
        </CardContent>
        <div className="p-6 pt-0 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
}
