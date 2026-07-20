'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';
import type { MfaEnableResponse } from '@/lib/types/auth.types';

type Step = 'idle' | 'setup' | 'disabling';

/** Self-service TOTP enrollment/disable — wraps the real auth-service MFA endpoints
 * (POST /mfa/enable, POST /mfa/verify, DELETE /mfa/disable). No mock QR/secret: the
 * QR code is the actual server-rendered otpauth:// PNG data URL from mfaService.initiateSetup. */
export default function MfaSetup() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState<Step>('idle');
  const [enrollment, setEnrollment] = useState<MfaEnableResponse | null>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const startSetup = async () => {
    setSubmitting(true);
    try {
      const res = await authApi.mfaEnable();
      setEnrollment(res.data.data);
      setStep('setup');
    } catch {
      toast.error('Could not start MFA setup');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSetup = async () => {
    if (code.length !== 6) return;
    setSubmitting(true);
    try {
      await authApi.mfaVerify({ code });
      setUser({ ...user, mfaEnabled: true });
      toast.success('Two-factor authentication enabled');
      reset();
    } catch {
      toast.error('Invalid code — check your authenticator app and try again');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDisable = async () => {
    if (code.length !== 6) return;
    setSubmitting(true);
    try {
      await authApi.mfaDisable(code);
      setUser({ ...user, mfaEnabled: false });
      toast.success('Two-factor authentication disabled');
      reset();
    } catch {
      toast.error('Invalid code');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep('idle');
    setEnrollment(null);
    setCode('');
  };

  const copySecret = () => {
    if (!enrollment) return;
    navigator.clipboard.writeText(enrollment.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'setup' && enrollment) {
    return (
      <div className="space-y-4 rounded-lg border p-4">
        <p className="text-sm font-medium">Scan this QR code with your authenticator app</p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- server-generated base64 QR, next/image's optimizer adds nothing here */}
          <img src={enrollment.qrCodeUrl} alt="MFA QR code" width={160} height={160} className="rounded border" />
          <div className="space-y-3 flex-1 min-w-0">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Or enter this key manually</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">{enrollment.secret}</code>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={copySecret}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recovery codes — store these somewhere safe</p>
              <div className="grid grid-cols-2 gap-1">
                {enrollment.recoveryCodes.map((rc) => (
                  <code key={rc} className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">{rc}</code>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Input
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-32 font-mono"
              />
              <Button size="sm" onClick={confirmSetup} disabled={code.length !== 6 || submitting}>
                {submitting ? 'Confirming…' : 'Confirm & enable'}
              </Button>
              <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'disabling') {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Enter your current 6-digit code to disable 2FA</p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="6-digit code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-32 font-mono"
          />
          <Button size="sm" variant="destructive" onClick={confirmDisable} disabled={code.length !== 6 || submitting}>
            {submitting ? 'Disabling…' : 'Disable 2FA'}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        {user.mfaEnabled
          ? <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
          : <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0" />}
        <div>
          <p className="text-sm font-medium">Two-factor authentication</p>
          <p className="text-xs text-muted-foreground">
            {user.mfaEnabled ? 'Your account is protected with an authenticator app.' : 'Add an authenticator app for a second sign-in factor.'}
          </p>
        </div>
        {user.mfaEnabled && <Badge variant="secondary">Enabled</Badge>}
      </div>
      {user.mfaEnabled ? (
        <Button variant="outline" size="sm" onClick={() => setStep('disabling')}>Disable</Button>
      ) : (
        <Button size="sm" onClick={startSetup} disabled={submitting}>
          {submitting ? 'Starting…' : 'Enable 2FA'}
        </Button>
      )}
    </div>
  );
}
