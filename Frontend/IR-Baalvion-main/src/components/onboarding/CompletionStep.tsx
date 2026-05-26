
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authService } from '@/core/services/auth.service';

export function CompletionStep({ data }: { data: any }) {
  const [status, setStatus] = useState<'analyzing' | 'finalizing' | 'success'>('analyzing');
  const router = useRouter();

  useEffect(() => {
    // Simulate high-security automated analysis
    const t1 = setTimeout(() => setStatus('finalizing'), 2000);
    const t2 = setTimeout(() => {
      // PHASE 6 RBAC ESCALATION
      // Here we elevate the user from 'public' to 'p1_institutional' in the mock session
      document.cookie = `baalvion_session_mock=p1_institutional; path=/; max-age=3600`;
      setStatus('success');
    }, 4500);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleEnterPortal = () => {
    authService.setRole('P1Investor');
    router.push('/dashboard');
  };

  return (
    <div className="animate-in fade-in duration-500">
      <CardHeader className="text-center border-b border-border/50 pb-8 bg-green-500/5">
        <div className="mx-auto mb-4">
          {status === 'analyzing' && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
          {status === 'finalizing' && <ShieldCheck className="h-12 w-12 text-blue-500 animate-pulse" />}
          {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {status === 'analyzing' && "Analyzing Profile..."}
          {status === 'finalizing' && "Granting Secure Access..."}
          {status === 'success' && "Portal Access Granted"}
        </CardTitle>
        <CardDescription>
          {status === 'analyzing' && "Running cross-registry compliance checks."}
          {status === 'finalizing' && "Configuring institutional security keys."}
          {status === 'success' && "Welcome to the Baalvion General Partner ecosystem."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 rounded-xl border border-border/50 bg-background/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Identity</span>
            <span className="text-sm font-bold">{data.fullName}</span>
          </div>
          <div className="flex justify-between items-center p-4 rounded-xl border border-border/50 bg-background/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Classification</span>
            <span className="text-sm font-bold text-green-500">Accredited (verified)</span>
          </div>
          <div className="flex justify-between items-center p-4 rounded-xl border border-border/50 bg-background/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Commitment</span>
            <span className="text-sm font-bold">${data.commitment?.toLocaleString()}</span>
          </div>
        </div>

        <Button
          disabled={status !== 'success'}
          onClick={handleEnterPortal}
          className="w-full h-12 font-bold uppercase tracking-widest bg-green-600 hover:bg-green-700"
        >
          Enter Investor Portal <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-[9px] text-center text-muted-foreground uppercase font-bold tracking-tighter">
          Your session role has been elevated to P1_INSTITUTIONAL.
        </p>
      </CardContent>
    </div>
  );
}
