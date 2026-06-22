'use client';

/**
 * @file register/page.tsx
 * @description Public self-service registration for buyers and sellers. Creates an account +
 * scoped organization via the gateway (auto-login: the gateway sets the httpOnly session cookies),
 * then hands off to phone verification. Distinct from /onboard, which submits an institutional
 * application for platform review and grants NO immediate access.
 *
 * Security: all real validation is server-side (auth-service Zod + rate limiting). The client-side
 * checks here are UX only. There is NO token in JS — identity rides the cookies the gateway sets.
 */

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, User, Building2, Phone, ShoppingCart, Store, UserPlus } from 'lucide-react';
import { PATHS } from '@/lib/paths';
import { publicAuthApi, type AccountType } from '@/lib/admin-api';
import { AuthShell } from '../accept-invite/_components/auth-shell';
import { AuthField, AuthError } from '../accept-invite/_components/auth-fields';

const MIN_PASSWORD_LENGTH = 8;

function describeRegisterError(code: string | undefined, message: string): string {
  switch (code) {
    case 'EMAIL_TAKEN':
      return 'An account with this email already exists. Sign in instead.';
    case 'VALIDATION_ERROR':
      return message || 'Please check the form and try again.';
    case 'RATE_LIMITED':
      return 'Too many attempts from this network. Please wait a moment and try again.';
    default:
      return message || 'We could not create your account. Please try again.';
  }
}

const ACCOUNT_TYPES: { value: AccountType; label: string; blurb: string; icon: typeof ShoppingCart }[] = [
  { value: 'buyer', label: 'Buyer', blurb: 'Source goods, run RFQs, finance & settle trades.', icon: ShoppingCart },
  { value: 'seller', label: 'Seller', blurb: 'List supply, win deals, fulfil & get paid.', icon: Store },
];

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialType: AccountType = searchParams.get('type') === 'seller' ? 'seller' : 'buyer';

  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value.trim() ?? '';
    const fullName = (form.elements.namedItem('fullName') as HTMLInputElement)?.value.trim() ?? '';
    const orgName = (form.elements.namedItem('orgName') as HTMLInputElement)?.value.trim() ?? '';
    const phone = (form.elements.namedItem('phone') as HTMLInputElement)?.value.trim() ?? '';
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value ?? '';
    const confirm = (form.elements.namedItem('confirmPassword') as HTMLInputElement)?.value ?? '';

    if (!email) return setError('Please enter your work email.');
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (password !== confirm) return setError('The two passwords do not match.');

    setSubmitting(true);
    try {
      await publicAuthApi.register({
        email,
        password,
        accountType,
        fullName: fullName || undefined,
        orgName: orgName || undefined,
        phone: phone || undefined,
      });
      // Success → the gateway set the session cookies (auto-login). Hard-navigate so the
      // AppProvider rehydrates identity from the cookies before the next screen renders.
      window.location.assign(PATHS.VERIFY_PHONE);
    } catch (err) {
      const e = err as Error & { code?: string };
      setError(describeRegisterError(e.code, e.message));
      setSubmitting(false);
    }
  };

  return (
    <>
      <CardHeader className="space-y-4 pb-8 pt-10 text-center border-b bg-muted/10">
        <div className="space-y-1">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter">Create Account</CardTitle>
          <CardDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
            Join the Trade Network
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-8">
        {/* Account type selector */}
        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">I am a</span>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account type">
            {ACCOUNT_TYPES.map((t) => {
              const Icon = t.icon;
              const active = accountType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setAccountType(t.value)}
                  disabled={submitting}
                  className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all disabled:opacity-60 ${
                    active
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border bg-muted/5 hover:border-primary/40 hover:bg-background'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-black uppercase tracking-tight">{t.label}</span>
                  <span className="text-[11px] font-medium leading-snug text-muted-foreground">{t.blurb}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} method="post" className="space-y-6">
          <AuthField id="fullName" name="fullName" label="Full Name" placeholder="Jane Trader" autoComplete="name" disabled={submitting} icon={User} />
          <AuthField id="orgName" name="orgName" label="Organization (optional)" placeholder="Acme Trading Co." autoComplete="organization" disabled={submitting} icon={Building2} />
          <AuthField id="email" name="email" type="email" label="Work Email" placeholder="you@company.com" required autoComplete="email" disabled={submitting} icon={Mail} />
          <AuthField id="phone" name="phone" type="tel" label="Phone (optional)" placeholder="+1 555 0100" autoComplete="tel" disabled={submitting} icon={Phone} />
          <AuthField id="password" name="password" type="password" label="Password" placeholder="••••••••" required autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} disabled={submitting} icon={Lock} />
          <AuthField id="confirmPassword" name="confirmPassword" type="password" label="Confirm Password" placeholder="••••••••" required autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} disabled={submitting} icon={Lock} />

          <p className="text-[10px] text-muted-foreground ml-1">
            By creating an account you agree to the{' '}
            <Link href={PATHS.TERMS_OF_USE} className="text-primary font-bold hover:underline">Terms</Link>{' '}and{' '}
            <Link href={PATHS.PRIVACY_POLICY} className="text-primary font-bold hover:underline">Privacy Policy</Link>.
          </p>

          <AuthError>{error}</AuthError>

          <Button type="submit" className="w-full h-16 font-black uppercase tracking-widest text-base shadow-xl" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <UserPlus className="mr-2 h-6 w-6" />}
            Create {accountType === 'seller' ? 'Seller' : 'Buyer'} Account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col border-t bg-muted/30 pt-8 pb-8 space-y-4">
        <p className="text-[10px] font-bold text-center text-muted-foreground w-full">
          Already have an account?{' '}
          <Link href={PATHS.LOGIN} className="text-primary font-black uppercase tracking-widest hover:underline">Sign In</Link>
        </p>
        <p className="text-[10px] font-bold text-center text-muted-foreground w-full">
          Need institutional onboarding?{' '}
          <Link href={PATHS.ONBOARD} className="text-primary font-black uppercase tracking-widest hover:underline">Request Access</Link>
        </p>
      </CardFooter>
    </>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell
      brandHeadline={
        <>
          Join Global <br />Trade <br />Infrastructure.
        </>
      }
      brandSubcopy="Create a buyer or seller account in minutes. Verify your email and phone to unlock execution, finance, and settlement."
    >
      <Suspense
        fallback={
          <CardContent className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
