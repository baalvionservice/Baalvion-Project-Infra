'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { requestEmailOtp, verifyEmailOtp, isApiError, type AuthUser } from '@/lib/auth-api';
import { Turnstile, captchaEnabled } from './turnstile';

type Step = 'details' | 'code' | 'success';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_LIMIT_REACHED = -1;

/** Validate an optional ?next into a safe in-ecosystem URL, else null. */
function safeNext(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('next');
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    const ok = u.protocol === 'https:' && (host === 'baalvion.com' || host.endsWith('.baalvion.com'));
    return ok ? u.toString() : null;
  } catch {
    return null;
  }
}

export function SignInForm() {
  const [step, setStep] = useState<Step>('details');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErr, setFieldErr] = useState<{ firstName?: string; lastName?: string; email?: string }>({});
  const [sentTo, setSentTo] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [resendsRemaining, setResendsRemaining] = useState(3);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const validateDetails = (): boolean => {
    const fe: typeof fieldErr = {};
    if (!firstName.trim()) fe.firstName = 'Required';
    if (!lastName.trim()) fe.lastName = 'Required';
    if (!EMAIL_RE.test(email.trim())) fe.email = 'Enter a valid email address';
    setFieldErr(fe);
    return Object.keys(fe).length === 0;
  };

  const sendCode = useCallback(
    async (isResend: boolean) => {
      setError('');
      if (!isResend && !validateDetails()) return;
      if (captchaEnabled && !captchaToken) {
        setError('Please complete the human verification to continue.');
        return;
      }
      setLoading(true);
      try {
        const res = await requestEmailOtp({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          captchaToken: captchaToken || undefined,
        });
        setSentTo(res.sentTo);
        setResendIn(res.resendAvailableInSeconds);
        setResendsRemaining(res.resendsRemaining);
        setCode('');
        setStep('code');
      } catch (e) {
        const err = isApiError(e) ? e : { code: 'UNKNOWN', message: 'Something went wrong.' };
        setError(err.message);
        if (captchaEnabled) setCaptchaToken('');
        if (err.code === 'OTP_RESEND_LIMIT') setResendsRemaining(RESEND_LIMIT_REACHED);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firstName, lastName, email, captchaToken],
  );

  const verify = useCallback(async () => {
    setError('');
    if (!/^\d{4,8}$/.test(code.trim())) {
      setError('Enter the code from your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyEmailOtp({ email: email.trim(), code: code.trim() });
      setUser(res.user);
      setIsNewUser(res.isNewUser);
      setStep('success');
    } catch (e) {
      const err = isApiError(e) ? e : { code: 'UNKNOWN', message: 'Something went wrong.' };
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [code, email]);

  const next = safeNext();

  return (
    <section className="w-full max-w-md border hairline bg-surface p-8">
      <p className="mono-label mb-3 text-accent">Baalvion · Sign in</p>

      {step === 'details' && (
        <div>
          <h1 className="display-h3 mb-2 text-foreground">Sign in or create your account</h1>
          <p className="mb-6 text-sm leading-relaxed text-muted">
            No password needed — we&rsquo;ll email you a one-time code.
          </p>

          {error && <Alert>{error}</Alert>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode(false);
            }}
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" id="firstName" error={fieldErr.firstName}>
                <input id="firstName" className={inputCls} autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ada" />
              </Field>
              <Field label="Last name" id="lastName" error={fieldErr.lastName}>
                <input id="lastName" className={inputCls} autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Lovelace" />
              </Field>
            </div>
            <Field label="Email address" id="email" error={fieldErr.email}>
              <input id="email" type="email" inputMode="email" className={inputCls} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ada@company.com" />
            </Field>

            <Turnstile onToken={setCaptchaToken} onExpire={() => setCaptchaToken('')} />

            <button type="submit" className={btnCls} disabled={loading}>
              {loading ? 'Sending code…' : 'Continue with email'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-2">
            Permanent email addresses only. Temporary / disposable inboxes are not accepted.
          </p>
        </div>
      )}

      {step === 'code' && (
        <div>
          <h1 className="display-h3 mb-2 text-foreground">Enter your code</h1>
          <p className="mb-6 text-sm leading-relaxed text-muted">
            We sent a 6-digit code to <span className="text-foreground">{sentTo}</span>. It expires in 5 minutes.
          </p>

          {error && <Alert>{error}</Alert>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
          >
            <Field label="Verification code" id="code">
              <input
                id="code"
                ref={codeRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className={`${inputCls} text-center font-mono text-2xl tracking-[0.6em]`}
              />
            </Field>
            <button type="submit" className={btnCls} disabled={loading || code.length < 4}>
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-2">
            {resendsRemaining === RESEND_LIMIT_REACHED ? (
              <>Maximum code requests reached. Please try again later.</>
            ) : resendIn > 0 ? (
              <>You can resend a code in {resendIn}s.</>
            ) : resendsRemaining <= 0 ? (
              <>No more resends available for now.</>
            ) : (
              <>
                Didn&rsquo;t get it?{' '}
                <button type="button" className="text-accent hover:text-accent-ink disabled:text-muted" onClick={() => void sendCode(true)} disabled={loading}>
                  Resend code
                </button>{' '}
                ({resendsRemaining} left)
              </>
            )}
            <br />
            <button
              type="button"
              className="text-accent hover:text-accent-ink"
              onClick={() => {
                setStep('details');
                setError('');
                setCode('');
                if (captchaEnabled) setCaptchaToken('');
              }}
            >
              Use a different email
            </button>
          </p>
        </div>
      )}

      {step === 'success' && user && (
        <div className="text-center">
          <div
            className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-accent text-2xl font-semibold text-ink-deep"
            style={{ fontFamily: 'var(--font-display)' }}
            aria-hidden
          >
            {user.initials}
          </div>
          <h1 className="display-h3 mb-2 text-foreground">
            {isNewUser ? 'Welcome' : 'Welcome back'}, {user.firstName || user.fullName || 'there'}! <span aria-hidden>👋</span>
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-muted">You&rsquo;re signed in across Baalvion.</p>
          {next ? (
            <a href={next} className={`${btnCls} inline-block no-underline`}>Continue</a>
          ) : (
            <a href="/" className={`${btnCls} inline-block no-underline`}>Return to baalvion.com</a>
          )}
        </div>
      )}
    </section>
  );
}

const inputCls =
  'w-full h-11 border hairline bg-ink-deep px-3 text-foreground placeholder:text-muted-2 transition-colors duration-200 focus:border-accent focus:outline-none';
const btnCls =
  'w-full h-11 bg-accent text-center text-sm font-medium text-ink-deep transition-colors duration-200 hover:bg-accent-ink disabled:cursor-not-allowed disabled:opacity-50';

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </label>
      {children}
      <span className="mt-1 block min-h-[0.9rem] text-[0.7rem] text-red-400">{error}</span>
    </div>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="mb-4 border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {children}
    </div>
  );
}
