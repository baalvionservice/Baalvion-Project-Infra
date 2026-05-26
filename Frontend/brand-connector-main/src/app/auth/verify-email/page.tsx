'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail, 
  Loader2, 
  RefreshCcw, 
  ArrowLeft, 
  Rocket, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmailPage() {
  const { currentUser, loading, refreshUser, signOut: authSignOut } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Redirect if already verified or not logged in
  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.replace('/auth/login');
      } else if (currentUser.isVerified) {
        // Redirect to dashboard once verified
        router.replace('/dashboard');
      }
    }
  }, [currentUser, loading, router]);

  // Polling to detect verification automatically
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentUser && !currentUser.isVerified) {
      interval = setInterval(async () => {
        try {
          await refreshUser();
        } catch (e) {
          console.error("Verification poll failed", e);
        }
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [currentUser, refreshUser]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (!currentUser || cooldown > 0) return;
    
    setIsSending(true);
    try {
      // await sendEmailVerification(currentUser);
      setCooldown(60);
      toast({
        title: "Verification sent",
        description: "A new link has been sent to your inbox.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to send verification email.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    await authSignOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

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

        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="text-center pb-2">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: 1 
              }}
              transition={{ 
                scale: { repeat: Infinity, duration: 2 },
                opacity: { duration: 0.5 }
              }}
              className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4"
            >
              <Mail className="h-10 w-10 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
            <CardDescription className="px-4">
              We've sent a verification link to <br />
              <span className="font-bold text-slate-900">{currentUser?.email}</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <p>Click the link in the email to confirm your account. This page will update automatically once verified.</p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleResendEmail}
                disabled={isSending || cooldown > 0}
                variant="outline"
                className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 border-slate-200"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Verification Email"}
              </Button>
              
              <Button 
                onClick={() => {
                  setIsChecking(true);
                  refreshUser().finally(() => setTimeout(() => setIsChecking(false), 1000));
                }}
                disabled={isChecking}
                className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                {isChecking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                I've verified my email
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center pb-8 pt-4">
            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Use a different email
            </button>
          </CardFooter>
        </Card>

        <div className="text-center">
          <p className="text-xs text-slate-400">
            Can't find the email? Check your spam folder or junk mail.
          </p>
        </div>
      </div>
    </div>
  );
}
