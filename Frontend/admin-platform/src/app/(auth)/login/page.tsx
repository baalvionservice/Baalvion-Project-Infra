'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Fingerprint, Lock, ShieldCheck, User2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid Admin ID (email)'),
  password: z.string().min(1, 'Passphrase is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { loginAsync, isLoggingIn } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await loginAsync(data);
      if (result?.data?.data?.mfaRequired) {
        router.push(`/mfa?token=${result.data.data.tempToken}`);
      }
      // success → useAuth routes to /welcome
    } catch {
      // surfaced via toast in useAuth
    }
  };

  return (
    <div className="bv-card">
      <div className="bv-stagger flex flex-col gap-5">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="bv-chip">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure Access Console
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[--bv-ink]">Welcome back</h1>
          <p className="text-sm text-[--bv-ink-dim]">
            Authenticate to enter the Baalvion mission-control platform
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="bv-field">
            <label htmlFor="email" className="bv-label">Admin ID</label>
            <div className="bv-input-wrap">
              <User2 className="bv-input-icon h-4 w-4" />
              <input
                id="email"
                type="email"
                placeholder="admin@baalvion.com"
                autoComplete="email"
                className={`bv-input ${errors.email ? 'bv-input--err' : ''}`}
                {...register('email')}
              />
            </div>
            {errors.email && <p className="bv-err">{errors.email.message}</p>}
          </div>

          <div className="bv-field">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="bv-label">Passphrase</label>
              <Link href="/forgot-password" className="bv-link">Forgot access?</Link>
            </div>
            <div className="bv-input-wrap">
              <Lock className="bv-input-icon h-4 w-4" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className={`bv-input ${errors.password ? 'bv-input--err' : ''}`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="bv-eye"
                aria-label={showPassword ? 'Hide passphrase' : 'Show passphrase'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="bv-err">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className={`bv-biobtn ${isLoggingIn ? 'bv-biobtn--scan' : ''}`}
          >
            {isLoggingIn && <span className="bv-scanline" />}
            <Fingerprint className={`h-5 w-5 ${isLoggingIn ? 'bv-bioicon--pulse' : ''}`} />
            {isLoggingIn ? 'Authenticating…' : 'Authenticate'}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-[0.7rem] text-[--bv-ink-dim]">
          <span className="bv-dot-live" /> Biometric-grade session · 256-bit encrypted channel
        </div>
      </div>
    </div>
  );
}
