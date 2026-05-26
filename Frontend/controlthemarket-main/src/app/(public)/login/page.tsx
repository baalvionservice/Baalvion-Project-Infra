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
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, User, Briefcase, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/lib/mock-data';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

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
          <CardTitle className="text-2xl font-headline">Log In As</CardTitle>
          <CardDescription>
            Select a mock role to log in and test the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Button
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
