'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { 
  Rocket, 
  Mail, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const auth = useAuth();
  const { toast } = useToast();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  async function onSubmit(values: ForgotPasswordValues) {
    if (cooldown > 0) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth!, values.email);
      setIsSuccess(true);
      setCooldown(60); // Start 60s cooldown
      toast({
        title: "Reset link sent",
        description: "Check your inbox for instructions.",
      });
    } catch (err: any) {
      console.error(err);
      let message = "Could not send reset email. Please try again.";
      if (err.code === 'auth/user-not-found') {
        // For security, you might want to show success even if user not found,
        // but here we follow request for "user-friendly messages".
        message = "No account found with this email address.";
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleResend = () => {
    form.handleSubmit(onSubmit)();
  };

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

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="request-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                  <CardDescription>
                    Enter your email and we'll send you a link to reset your password.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-semibold">Email Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input 
                                  placeholder="name@example.com" 
                                  className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-primary" 
                                  disabled={isLoading}
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
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Reset Link"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col items-center pb-8">
                  <Link 
                    href="/auth/login" 
                    className="text-sm font-bold text-slate-500 hover:text-primary flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="success-message"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden p-8">
                <div className="flex flex-col items-center space-y-6">
                  <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Email Sent!</h2>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      We've sent a password reset link to <span className="font-bold text-slate-900">{form.getValues('email')}</span>.
                      Please check your inbox and follow the instructions.
                    </p>
                  </div>
                  
                  <div className="w-full space-y-4 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleResend}
                      disabled={cooldown > 0 || isLoading}
                      className="w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Email"}
                    </Button>
                    
                    <Link href="/auth/login" className="block w-full">
                      <Button variant="ghost" className="w-full h-11 rounded-xl font-bold text-slate-500">
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
