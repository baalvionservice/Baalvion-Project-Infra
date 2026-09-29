'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(1, 'Password is required'),
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
      <div className="bv-stagger flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="bv-eyebrow-row">
            <span className="bv-eyebrow">
              <span className="bv-dot-live bv-dot-live--red" />
              Secure sign-in
            </span>
            <span className="bv-eyebrow bv-eyebrow--muted">
              <ShieldCheck className="h-3.5 w-3.5" />
              RS256
            </span>
          </div>
          <h1 className="bv-title">Sign in to Mission Control</h1>
          <p className="bv-sub">
            Access is scoped to the sites and businesses granted to your account.
          </p>
        </div>

        {/* method=post so a submit before hydration posts a body instead of putting the
            password in the URL, history and access logs as a query string. */}
        <form method="post" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

          <div className="bv-field">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="bv-label">Password</label>
              <Link href="/forgot-password" className="bv-link">Forgot password?</Link>
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
            {isLoggingIn ? 'Authenticating' : 'Sign in'}
            {!isLoggingIn && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="bv-trust">
          <span>Encrypted session</span>
          <span>One identity, every console</span>
        </div>
      </div>
    </div>
  );
}
