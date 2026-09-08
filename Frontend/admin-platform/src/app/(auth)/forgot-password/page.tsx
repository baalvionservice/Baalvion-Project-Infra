'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';

const schema = z.object({ email: z.string().email('Enter a valid work email') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: Form) => authApi.forgotPassword(data),
    onSuccess: () => setSent(true),
    onError: (e: { message: string }) => toast.error(e.message),
  });

  if (sent) {
    return (
      <div className="bv-card">
        <div className="bv-stagger flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="bv-eyebrow">
              <span className="bv-dot-live bv-dot-live--red" />
              Reset requested
            </span>
            <h1 className="bv-title">Check your email</h1>
            <p className="bv-sub">
              If that address belongs to a Baalvion account, a reset link is on its way.
              The link expires shortly — request another if it lapses.
            </p>
          </div>

          <Link href="/login" className="bv-ghost-btn">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bv-card">
      <div className="bv-stagger flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="bv-eyebrow">
            <span className="bv-dot-live bv-dot-live--red" />
            Password reset
          </span>
          <h1 className="bv-title">Recover your access</h1>
          <p className="bv-sub">
            Enter the work email tied to your admin account and we&rsquo;ll send a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
          <div className="bv-field">
            <label htmlFor="email" className="bv-label">Work email</label>
            <div className="bv-input-wrap">
              <Mail className="bv-input-icon h-4 w-4" />
              <input
                id="email"
                type="email"
                placeholder="you@baalvion.com"
                autoComplete="email"
                className={`bv-input ${errors.email ? 'bv-input--err' : ''}`}
                {...register('email')}
              />
            </div>
            {errors.email && <p className="bv-err">{errors.email.message}</p>}
          </div>

          <button type="submit" disabled={mutation.isPending} className="bv-biobtn">
            {mutation.isPending ? 'Sending' : 'Send reset link'}
            {!mutation.isPending && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="bv-trust bv-trust--center">
          <Link href="/login" className="bv-link">← Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
