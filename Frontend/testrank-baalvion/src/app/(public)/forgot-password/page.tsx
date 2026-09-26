'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, MailCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth/auth-shell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      // Same-origin BFF (→ auth-gateway → auth-service). The backend always responds
      // generically, so we never reveal whether an account exists.
      await fetch('/auth-bff/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});
    } finally {
      setIsSubmitting(false);
      setSent(true);
    }
  };

  return (
    <AuthShell
      variant="default"
      title={sent ? 'Check your inbox' : 'Reset your password'}
      subtitle={
        sent
          ? undefined
          : "Enter your email and we'll send you a secure link to set a new password."
      }
      footer={
        <Link href="/login" className="inline-flex items-center font-medium text-primary underline-offset-4 hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-6 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-secondary/15 text-secondary">
            <MailCheck className="h-6 w-6" />
          </span>
          <p className="text-[15px] text-foreground">
            If an account exists for <span className="font-medium">{email}</span>, a password-reset link is on its way.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Didn&apos;t get it? Check spam, or try again in a minute.</p>
          <Button variant="outline" className="mt-5 w-full" onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11 pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" size="lg" className="h-11 w-full text-[15px] font-semibold" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
