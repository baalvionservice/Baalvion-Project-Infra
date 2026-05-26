'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/design-system/typography/text';
import { 
  Lock, 
  Mail, 
  Key, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Fingerprint, 
  UserCircle,
  AlertCircle,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type AuthStep = 'login' | '2fa' | 'success' | 'failure';

/**
 * Mock Authentication Flow Component.
 * Simulates a multi-step login and 2FA process for security prototyping.
 */
export function AuthFlowMock() {
  const [step, setStep] = useState<AuthStep>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate initial credential check
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    
    if (password === 'fail') {
      setStep('failure');
    } else {
      setStep('2fa');
      toast({
        title: "Credentials Verified",
        description: "Standard handshake successful. 2FA protocol required.",
      });
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate biometric/OTP verification
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    
    if (otp === '000000') {
      setStep('failure');
    } else {
      setStep('success');
      toast({
        title: "Identity Authenticated",
        description: "Zero-trust session established.",
      });
    }
  };

  const reset = () => {
    setStep('login');
    setOtp('');
    setPassword('');
  };

  return (
    <Card className="glass-card border-none shadow-2xl overflow-hidden max-w-md mx-auto">
      <CardHeader className="bg-primary/5 border-b border-white/5 p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
          <Lock className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold">Secure Access Node</CardTitle>
        <CardDescription>Handshake Protocol v4.2</CardDescription>
      </CardHeader>

      <CardContent className="p-8">
        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Identity Locator (Email)</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="email" 
                    placeholder="admin@imperialpedia.com" 
                    className="pl-10 bg-background/50 border-white/10 h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Secret Key (Password)</Label>
                <div className="relative group">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="password" 
                    placeholder="••••••••••••" 
                    className="pl-10 bg-background/50 border-white/10 h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Text variant="caption" className="text-muted-foreground italic">Type "fail" to test rejection logic.</Text>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="mr-2 h-4 w-4" /> Initiate Handshake</>}
            </Button>
          </form>
        )}

        {step === '2fa' && (
          <form onSubmit={handle2FA} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-2 text-primary bg-primary/5 p-4 rounded-xl border border-primary/10">
              <Fingerprint className="h-5 w-5" />
              <Text variant="caption" className="font-bold">MFA Verification Triggered</Text>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center block">One-Time Password (OTP)</Label>
                <Input 
                  placeholder="0 0 0 0 0 0" 
                  className="bg-background/50 border-white/10 h-14 text-center text-2xl font-mono tracking-[0.5em]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
                <Text variant="caption" className="text-muted-foreground text-center block">Enter "000000" to test failed verification.</Text>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-xl shadow-secondary/20 transition-all">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Identity Node'}
            </Button>
            <button type="button" onClick={() => setStep('login')} className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary flex items-center justify-center gap-1">
              <ChevronLeft className="h-3 w-3" /> Back to Credentials
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <Text variant="h3" className="text-2xl font-bold">Access Authorized</Text>
              <Text variant="bodySmall" className="text-muted-foreground">Welcome back, Administrator. Your session is now cryptographically signed.</Text>
            </div>
            <Button onClick={reset} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">Return to Portal</Button>
          </div>
        )}

        {step === 'failure' && (
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <AlertCircle className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <Text variant="h3" className="text-2xl font-bold text-destructive">Handshake Rejected</Text>
              <Text variant="bodySmall" className="text-muted-foreground">The security kernel identified a signature mismatch. This attempt has been logged in the audit trail.</Text>
            </div>
            <Button onClick={reset} variant="outline" className="w-full rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5">Retry Verification</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
