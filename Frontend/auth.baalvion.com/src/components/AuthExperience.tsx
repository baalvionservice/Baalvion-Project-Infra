'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { requestEmailOtp, verifyEmailOtp, type ApiError, type AuthUser } from '@/lib/api';
import { Turnstile, captchaEnabled } from './Turnstile';

type Step = 'details' | 'code' | 'success';

/** The verified user plus the access token to hand off to the originating site via SSO. */
type SessionUser = AuthUser & { accessToken: string };

interface Props {
  brandName: string;
  tagline: string;
  mode: 'light' | 'dark';
  returnTo: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_LIMIT_REACHED = -1;

function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === 'object' && 'message' in e;
}

/** Build the SSO hand-off URL: <site>/auth/sso-callback?next=<returnTo>#token=<jwt>. */
function ssoUrl(returnTo: string, accessToken: string): string {
  const cb = new URL('/auth/sso-callback', returnTo);
  cb.searchParams.set('next', returnTo);
  return `${cb.toString()}#token=${encodeURIComponent(accessToken)}`;
}

export function AuthExperience({ brandName, tagline, mode, returnTo }: Props) {
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
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Focus the code field when entering step 2.
  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  // Auto-continue to the originating site shortly after the greeting renders.
  useEffect(() => {
    if (step !== 'success' || !user || !returnTo) return;
    const t = setTimeout(() => {
      window.location.assign(ssoUrl(returnTo, user.accessToken));
    }, 1800);
    return () => clearTimeout(t);
  }, [step, user, returnTo]);

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
        // A consumed/expired captcha token can't be reused — force a fresh challenge.
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
      // Stash the access token on the user object for the SSO hand-off.
      setUser({ ...res.user, accessToken: res.accessToken });
      setIsNewUser(res.isNewUser);
      setStep('success');
    } catch (e) {
      const err = isApiError(e) ? e : { code: 'UNKNOWN', message: 'Something went wrong.' };
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [code, email]);

  // ── Render ──────────────────────────────────────────────────────────────────────
  return (
    <section className="card" aria-live="polite">
      <header className="brand">
        <span className="brand__mark">
          {brandName}
          <span className="brand__dot" aria-hidden />
        </span>
        <span className="brand__tagline">{tagline}</span>
      </header>

      {step === 'details' && (
        <div className="step">
          <h1 className="h1">Sign in or create your account</h1>
          <p className="sub">No password needed. We&rsquo;ll email you a one-time code to continue.</p>

          {error && <Alert kind="error">{error}</Alert>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode(false);
            }}
            noValidate
          >
            <div className="row">
              <div className="field">
                <label className="label" htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  className="input"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-invalid={!!fieldErr.firstName}
                  placeholder="Ada"
                />
                <span className="field-error">{fieldErr.firstName}</span>
              </div>
              <div className="field">
                <label className="label" htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  className="input"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  aria-invalid={!!fieldErr.lastName}
                  placeholder="Lovelace"
                />
                <span className="field-error">{fieldErr.lastName}</span>
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!fieldErr.email}
                placeholder="ada@company.com"
              />
              <span className="field-error">{fieldErr.email}</span>
            </div>

            <Turnstile theme={mode} onToken={setCaptchaToken} onExpire={() => setCaptchaToken('')} />

            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Sending code…' : 'Continue with email'}
            </button>
          </form>

          <p className="meta">
            We only accept permanent email addresses. Temporary / disposable inboxes are not allowed.
          </p>
        </div>
      )}

      {step === 'code' && (
        <div className="step">
          <h1 className="h1">Enter your code</h1>
          <p className="sub">
            We sent a 6-digit code to <strong>{sentTo}</strong>. It expires in 5 minutes.
          </p>

          {error && <Alert kind="error">{error}</Alert>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
          >
            <div className="field">
              <label className="label" htmlFor="code">Verification code</label>
              <input
                id="code"
                ref={codeRef}
                className="input otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
              />
            </div>

            <button className="btn" type="submit" disabled={loading || code.length < 4}>
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>
          </form>

          <p className="meta">
            {resendsRemaining === RESEND_LIMIT_REACHED ? (
              <>Maximum code requests reached. Please try again later.</>
            ) : resendIn > 0 ? (
              <>You can resend a code in {resendIn}s.</>
            ) : resendsRemaining <= 0 ? (
              <>No more resends available for now.</>
            ) : (
              <>
                Didn&rsquo;t get it?{' '}
                <button className="link" type="button" onClick={() => void sendCode(true)} disabled={loading}>
                  Resend code
                </button>{' '}
                ({resendsRemaining} left)
              </>
            )}
            <br />
            <button
              className="link"
              type="button"
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
        <div className="success">
          <div className="avatar" aria-hidden>{user.initials}</div>
          <h1 className="greeting">
            {isNewUser ? 'Welcome' : 'Welcome back'}, {user.firstName || user.fullName || 'there'}!{' '}
            <span className="wave" aria-hidden>👋</span>
          </h1>
          <p className="sub" style={{ textAlign: 'center' }}>
            {returnTo ? 'Taking you back to ' + new URL(returnTo).hostname + '…' : "You're signed in."}
          </p>
          {returnTo && (
            <button
              className="btn"
              type="button"
              onClick={() => window.location.assign(ssoUrl(returnTo, user.accessToken))}
            >
              Continue
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Alert({ kind, children }: { kind: 'error' | 'info'; children: React.ReactNode }) {
  return (
    <div className={`alert alert--${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      <span aria-hidden>{kind === 'error' ? '⚠' : 'ℹ'}</span>
      <span>{children}</span>
    </div>
  );
}
