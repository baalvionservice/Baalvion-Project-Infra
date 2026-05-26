'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { 
  Rocket, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const oobCode = searchParams.get('oobCode');

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!oobCode) {
      setError("Invalid or missing reset code. Please request a new link.");
      setIsLoading(false);
      return;
    }

    // Verify the action code
    verifyPasswordResetCode(auth!, oobCode)
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("This reset link has expired or has already been used.");
        setIsLoading(false);
      });
  }, [auth, oobCode]);

  async function onSubmit(values: ResetPasswordValues) {
    if (!oobCode) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await confirmPasswordReset(auth!, oobCode, values.password);
      setIsSuccess(true);
      toast({
        title: "Password Updated",
        description: "Your password has been reset successfully.",
      });
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to reset password. Please try again or request a new link.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-slate-500 font-medium">Verifying reset code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-200 shadow-xl rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Oops!</h2>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
          <Link href="/auth/forgot-password" title="Request new link">
            <Button className="rounded-xl font-bold px-8">Request New Link</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="border-slate-200 shadow-xl rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Success!</h2>
            <p className="text-slate-500 text-sm">Your password has been changed. Redirecting to login...</p>
          </div>
          <Link href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full rounded-xl font-bold">Go to Login</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below to secure your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-primary" 
                        disabled={isSubmitting}
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-primary" 
                        disabled={isSubmitting}
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-md font-bold transition-all shadow-lg shadow-primary/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center mb-6">
            <div className="bg-primary p-2 rounded-xl mr-2">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <span className="font-headline font-bold text-2xl tracking-tight">Baalvion <span className="text-primary">Connect</span></span>
          </Link>
        </div>

        <Suspense fallback={
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
