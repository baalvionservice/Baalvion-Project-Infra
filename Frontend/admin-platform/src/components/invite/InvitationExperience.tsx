'use client';

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  Feather,
  Globe,
  Linkedin,
  Loader2,
  Lock,
  Plus,
  Quote,
  ShieldCheck,
  Sparkles,
  User2,
  X,
} from 'lucide-react';
import { isAxiosError } from 'axios';
import BaalvionMark from '@/components/auth/BaalvionMark';
import { initials } from '@/lib/utils/format';
import { invitationsApi } from '@/lib/api/invitations';
import { authApi } from '@/lib/api/auth';
import { authClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';
import type { ApiResponse } from '@/lib/types/common.types';
import type { AuthUser } from '@/lib/types/auth.types';
import type { InvitationDetails } from '@/lib/types/cms-invitation.types';

type Phase = 'reveal' | 'claim' | 'profile' | 'done';

const MIN_PASSPHRASE = 10;

const DEFAULT_PERKS = [
  'A verified, bylined author profile built for search authority',
  'Direct access to the newsroom and editorial calendar',
  'Your work distributed across the Baalvion publishing network',
];

export default function InvitationExperience({ token }: { token: string }) {
  const router = useRouter();

  const [invite, setInvite] = useState<InvitationDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('reveal');

  // Load the token-scoped invitation. The token itself is the credential.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await invitationsApi.get(token);
        if (!alive) return;
        setInvite(res.data.data);
      } catch (err) {
        if (!alive) return;
        setLoadError(
          isAxiosError(err) && err.response?.status === 404
            ? 'This invitation link is invalid or has already been claimed.'
            : 'We could not load this invitation. Please try again shortly.',
        );
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  if (loadError) return <InviteNotice tone="error" title="Invitation unavailable" body={loadError} />;
  if (!invite) return <InviteLoading />;

  if (invite.status === 'accepted')
    return (
      <InviteNotice
        tone="ok"
        title="Already claimed"
        body="This seat has already been activated. Sign in to enter the newsroom."
        cta={{ label: 'Go to sign in', onClick: () => router.replace('/login') }}
      />
    );
  if (invite.status === 'expired' || invite.status === 'revoked')
    return (
      <InviteNotice
        tone="error"
        title="Invitation expired"
        body="This private invitation is no longer active. Ask your editor to send a fresh one."
      />
    );

  return (
    <div className="bv-content">
      <div className="bv-reveal mb-7">
        <BaalvionMark size={42} />
      </div>

      {phase === 'reveal' && <Reveal invite={invite} onAccept={() => setPhase('claim')} />}
      {phase !== 'reveal' && phase !== 'done' && (
        <ClaimAndProfile
          invite={invite}
          token={token}
          phase={phase}
          setPhase={setPhase}
          onComplete={(redirectTo) => {
            setPhase('done');
            window.setTimeout(() => router.replace(redirectTo || '/welcome'), 2600);
          }}
        />
      )}
      {phase === 'done' && <Done publication={invite.publicationName} />}

      <div className="bv-footer">
        Private invitation · Non-transferable · Baalvion Editorial Network
      </div>
    </div>
  );
}

/* ── Phase 1: the reveal ──────────────────────────────────────────────────── */

function Reveal({ invite, onAccept }: { invite: InvitationDetails; onAccept: () => void }) {
  const perks = DEFAULT_PERKS;
  return (
    <>
      <div className="bv-reveal bv-reveal-d1 bv-halo mb-6">
        <div className="bv-halo__inner">
          <Feather className="h-11 w-11 text-[--bv-blue-soft]" strokeWidth={1.4} />
        </div>
      </div>

      <span className="bv-reveal bv-reveal-d1 bv-chip mb-5">
        <Sparkles className="h-3.5 w-3.5" /> Private invitation · {invite.roleLabel}
      </span>

      <h1 className="bv-greet bv-reveal bv-reveal-d2 max-w-3xl text-center">
        You&apos;re invited to write for{' '}
        <span className="bv-greet__role">{invite.publicationName}</span>
      </h1>

      <p className="bv-reveal bv-reveal-d2 mt-4 max-w-xl text-center text-base leading-relaxed text-[#c3cce6]">
        {invite.inviterName ? `${invite.inviterName} has` : 'The editorial team has'} personally
        reserved a <strong className="text-[--bv-ink]">{invite.roleLabel}</strong> seat for you. The
        byline is yours alone.
      </p>

      {invite.personalNote && (
        <figure className="bv-reveal bv-reveal-d3 bv-quote mt-7 max-w-lg">
          <Quote className="bv-quote__mark h-5 w-5" />
          <blockquote>{invite.personalNote}</blockquote>
          {invite.inviterName && <figcaption>— {invite.inviterName}</figcaption>}
        </figure>
      )}

      <ul className="bv-reveal bv-reveal-d3 bv-perks mt-7 max-w-md">
        {perks.map((p) => (
          <li key={p}>
            <BadgeCheck className="h-4 w-4 text-[--bv-blue-soft]" />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <div className="bv-reveal bv-reveal-d4 mt-9 flex flex-col items-center gap-3">
        <button type="button" onClick={onAccept} className="bv-biobtn bv-biobtn--wide">
          Accept your seat <ArrowRight className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-2 text-[0.7rem] text-[--bv-ink-dim]">
          <ShieldCheck className="h-3.5 w-3.5" /> Reserved for {invite.email}
        </span>
      </div>
    </>
  );
}

/* ── Phase 2+3: claim credentials + author profile ───────────────────────── */

interface ProfileState {
  fullName: string;
  passphrase: string;
  confirm: string;
  showPass: boolean;
  byline: string;
  title: string;
  credentials: string;
  bio: string;
  avatarUrl: string;
  expertise: string[];
  linkedin: string;
  x: string;
}

const EMPTY: ProfileState = {
  fullName: '',
  passphrase: '',
  confirm: '',
  showPass: false,
  byline: '',
  title: '',
  credentials: '',
  bio: '',
  avatarUrl: '',
  expertise: [],
  linkedin: '',
  x: '',
};

// Raw shape of auth-service's /login response, read directly (bypassing the shared
// authApi.login normalizer, which assumes a token pair is always present and does
// not yet handle the MFA-continuation branches) so an existing account under MFA
// fails safe here instead of throwing.
interface RawLoginResult {
  accessToken?: string;
  user?: {
    id: string | number;
    email: string;
    fullName?: string;
    name?: string;
    avatarUrl?: string | null;
    role: string;
    status: string;
    orgId?: string | null;
    mfaEnabled: boolean;
    emailVerified: boolean;
  };
  expiresAt?: string;
  mfa_required?: boolean;
  mfa_enrollment_required?: boolean;
}

function ClaimAndProfile({
  invite,
  token,
  phase,
  setPhase,
  onComplete,
}: {
  invite: InvitationDetails;
  token: string;
  phase: Phase;
  setPhase: (p: Phase) => void;
  onComplete: (redirectTo: string) => void;
}) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [f, setF] = useState<ProfileState>(EMPTY);
  const [expertiseDraft, setExpertiseDraft] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [claiming, setClaiming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof ProfileState>(k: K, v: ProfileState[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const monogram = useMemo(
    () => initials(f.byline || f.fullName || invite.email),
    [f.byline, f.fullName, invite.email],
  );

  const validateClaimFields = (): boolean => {
    const e: Record<string, string> = {};
    if (!invite.hasAccount && f.fullName.trim().length < 2) e.fullName = 'Tell us your full name';
    if (!invite.hasAccount) {
      if (f.passphrase.length < MIN_PASSPHRASE)
        e.passphrase = `Use at least ${MIN_PASSPHRASE} characters`;
      if (f.confirm !== f.passphrase) e.confirm = 'Passphrases do not match';
    } else if (f.passphrase.length < 1) {
      e.passphrase = 'Enter your passphrase';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Establishes the actual platform session (auth-service owns the account/password —
  // this call either creates it or verifies it) before letting the visitor into the
  // author-profile step. Possession of the invite token never substitutes for proving
  // the passphrase on an EXISTING account.
  const claimAccount = async (): Promise<boolean> => {
    if (!validateClaimFields()) return false;
    setClaiming(true);
    setErrors({});
    try {
      if (invite.hasAccount) {
        const res = await authClient.post<ApiResponse<RawLoginResult>>('/login', {
          email: invite.email,
          password: f.passphrase,
        });
        const raw = res.data.data;
        if (raw.mfa_required || raw.mfa_enrollment_required || !raw.accessToken || !raw.user) {
          setErrors({ passphrase: 'This account needs extra verification — sign in normally, then reopen this invitation link.' });
          return false;
        }
        const expiresIn = raw.expiresAt
          ? Math.max(60, Math.floor((new Date(raw.expiresAt).getTime() - Date.now()) / 1000))
          : 900;
        const user: AuthUser = {
          id: Number(raw.user.id),
          email: raw.user.email,
          fullName: raw.user.fullName ?? raw.user.name ?? '',
          avatarUrl: raw.user.avatarUrl ?? null,
          status: raw.user.status as AuthUser['status'],
          emailVerifiedAt: raw.user.emailVerified ? new Date().toISOString() : null,
          mfaEnabled: raw.user.mfaEnabled,
          role: raw.user.role as AuthUser['role'],
          orgId: raw.user.orgId ?? null,
          permissions: [],
          sessionId: '',
          createdAt: new Date().toISOString(),
        };
        setAuth(user, raw.accessToken, expiresIn, null);
      } else {
        const res = await authApi.register({
          email: invite.email,
          password: f.passphrase,
          fullName: f.fullName.trim(),
        });
        const { user, accessToken, expiresIn } = res.data.data;
        setAuth(user, accessToken, expiresIn, null);
      }
      return true;
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message
        : undefined;
      setErrors({ passphrase: message || (invite.hasAccount ? 'Incorrect passphrase.' : 'Could not create your account. Please try again.') });
      return false;
    } finally {
      setClaiming(false);
    }
  };

  const validateProfile = (): boolean => {
    const e: Record<string, string> = {};
    if ((f.byline.trim() || f.fullName.trim()).length < 2) e.byline = 'A public byline is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addExpertise = () => {
    const v = expertiseDraft.trim();
    if (v && !f.expertise.includes(v) && f.expertise.length < 8) {
      set('expertise', [...f.expertise, v]);
    }
    setExpertiseDraft('');
  };

  const onExpertiseKey = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter' || ev.key === ',') {
      ev.preventDefault();
      addExpertise();
    } else if (ev.key === 'Backspace' && !expertiseDraft && f.expertise.length) {
      set('expertise', f.expertise.slice(0, -1));
    }
  };

  const submit = async () => {
    if (!validateProfile()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await invitationsApi.accept(token, {
        authorProfile: {
          name: (f.byline.trim() || f.fullName.trim()),
          title: f.title.trim() || undefined,
          credentials: f.credentials.trim() || undefined,
          bio: f.bio.trim() || undefined,
          avatarUrl: f.avatarUrl.trim() || undefined,
          expertise: f.expertise,
          social:
            f.linkedin.trim() || f.x.trim()
              ? { linkedin: f.linkedin.trim() || undefined, x: f.x.trim() || undefined }
              : undefined,
        },
      });
      onComplete(res.data.data.redirectTo);
    } catch (err) {
      setSubmitError(
        isAxiosError(err)
          ? (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message || 'We could not activate your seat. Please try again.'
          : 'Something went wrong. Please try again.',
      );
      setSubmitting(false);
    }
  };

  const step = phase === 'claim' ? 1 : 2;

  return (
    <div className="bv-card bv-card--wide bv-reveal">
      <StepDots step={step} />

      {phase === 'claim' && (
        <div className="bv-stagger flex flex-col gap-4">
          <header className="text-center">
            <h2 className="text-xl font-semibold tracking-tight text-[--bv-ink]">Claim your seat</h2>
            <p className="mt-1 text-sm text-[--bv-ink-dim]">
              {invite.hasAccount
                ? 'We recognise your account — confirm your passphrase to continue.'
                : 'Create the account that protects your byline.'}
            </p>
          </header>

          {!invite.hasAccount && (
            <Field label="Full name" error={errors.fullName}>
              <div className="bv-input-wrap">
                <User2 className="bv-input-icon h-4 w-4" />
                <input
                  className={`bv-input ${errors.fullName ? 'bv-input--err' : ''}`}
                  placeholder="Ada Lovelace"
                  value={f.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  autoComplete="name"
                />
              </div>
            </Field>
          )}

          <Field label={invite.hasAccount ? 'Passphrase' : 'Create a passphrase'} error={errors.passphrase}>
            <div className="bv-input-wrap">
              <Lock className="bv-input-icon h-4 w-4" />
              <input
                type={f.showPass ? 'text' : 'password'}
                className={`bv-input ${errors.passphrase ? 'bv-input--err' : ''}`}
                placeholder="••••••••••••"
                value={f.passphrase}
                onChange={(e) => set('passphrase', e.target.value)}
                autoComplete={invite.hasAccount ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="bv-eye"
                onClick={() => set('showPass', !f.showPass)}
                aria-label={f.showPass ? 'Hide passphrase' : 'Show passphrase'}
              >
                {f.showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {!invite.hasAccount && (
            <Field label="Confirm passphrase" error={errors.confirm}>
              <div className="bv-input-wrap">
                <Lock className="bv-input-icon h-4 w-4" />
                <input
                  type={f.showPass ? 'text' : 'password'}
                  className={`bv-input ${errors.confirm ? 'bv-input--err' : ''}`}
                  placeholder="••••••••••••"
                  value={f.confirm}
                  onChange={(e) => set('confirm', e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </Field>
          )}

          <button
            type="button"
            className={`bv-biobtn mt-1 ${claiming ? 'bv-biobtn--scan' : ''}`}
            disabled={claiming}
            onClick={async () => {
              if (await claimAccount()) setPhase('profile');
            }}
          >
            {claiming && <span className="bv-scanline" />}
            {claiming ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {claiming ? 'Verifying…' : 'Continue'}
            {!claiming && <ArrowRight className="h-5 w-5" />}
          </button>
        </div>
      )}

      {phase === 'profile' && (
        <div className="bv-stagger flex flex-col gap-4">
          <header className="text-center">
            <h2 className="text-xl font-semibold tracking-tight text-[--bv-ink]">
              Build your author profile
            </h2>
            <p className="mt-1 text-sm text-[--bv-ink-dim]">
              This is your public identity on {invite.publicationName} — the foundation of your
              search authority.
            </p>
          </header>

          <div className="flex items-center gap-3">
            <div className="bv-avatar" aria-hidden>
              {f.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.avatarUrl} alt="" />
              ) : (
                <span>{monogram}</span>
              )}
            </div>
            <Field label="Avatar URL" hint="optional" className="flex-1">
              <input
                className="bv-input bv-input--bare"
                placeholder="https://…/you.jpg"
                value={f.avatarUrl}
                onChange={(e) => set('avatarUrl', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Public byline" error={errors.byline}>
            <input
              className={`bv-input bv-input--bare ${errors.byline ? 'bv-input--err' : ''}`}
              placeholder="How your name appears on articles"
              value={f.byline}
              onChange={(e) => set('byline', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title" hint="optional">
              <input
                className="bv-input bv-input--bare"
                placeholder="Markets Correspondent"
                value={f.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </Field>
            <Field label="Credentials" hint="powers E-E-A-T">
              <input
                className="bv-input bv-input--bare"
                placeholder="CFA · 12y in commodities"
                value={f.credentials}
                onChange={(e) => set('credentials', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Short bio" hint="optional">
            <textarea
              className="bv-textarea"
              rows={3}
              placeholder="A sentence or two on who you are and what you cover."
              value={f.bio}
              onChange={(e) => set('bio', e.target.value)}
            />
          </Field>

          <Field label="Areas of expertise" hint="press Enter to add">
            <div className="bv-tags">
              {f.expertise.map((tag) => (
                <span key={tag} className="bv-tag">
                  {tag}
                  <button type="button" onClick={() => set('expertise', f.expertise.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {f.expertise.length < 8 && (
                <span className="bv-tags__input">
                  <input
                    value={expertiseDraft}
                    onChange={(e) => setExpertiseDraft(e.target.value)}
                    onKeyDown={onExpertiseKey}
                    onBlur={addExpertise}
                    placeholder={f.expertise.length ? 'Add another…' : 'e.g. Monetary policy'}
                  />
                  {expertiseDraft && (
                    <button type="button" onClick={addExpertise} aria-label="Add expertise">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="LinkedIn" hint="optional">
              <div className="bv-input-wrap">
                <Linkedin className="bv-input-icon h-4 w-4" />
                <input
                  className="bv-input"
                  placeholder="linkedin.com/in/you"
                  value={f.linkedin}
                  onChange={(e) => set('linkedin', e.target.value)}
                />
              </div>
            </Field>
            <Field label="X / website" hint="optional">
              <div className="bv-input-wrap">
                <Globe className="bv-input-icon h-4 w-4" />
                <input
                  className="bv-input"
                  placeholder="@you or your site"
                  value={f.x}
                  onChange={(e) => set('x', e.target.value)}
                />
              </div>
            </Field>
          </div>

          {submitError && <p className="bv-err text-center">{submitError}</p>}

          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              className="bv-ghost-btn"
              onClick={() => setPhase('claim')}
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              className={`bv-biobtn flex-1 ${submitting ? 'bv-biobtn--scan' : ''}`}
              onClick={submit}
              disabled={submitting}
            >
              {submitting && <span className="bv-scanline" />}
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Feather className="h-5 w-5" />}
              {submitting ? 'Activating your seat…' : 'Enter the newsroom'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Phase 4: done ────────────────────────────────────────────────────────── */

function Done({ publication }: { publication: string }) {
  return (
    <>
      <div className="bv-reveal bv-halo mb-7">
        <div className="bv-halo__inner">
          <Check className="h-12 w-12 text-[#34d399]" strokeWidth={1.6} />
        </div>
      </div>
      <span className="bv-reveal bv-reveal-d1 bv-chip mb-5">
        <span className="bv-dot-live" /> Seat activated
      </span>
      <h1 className="bv-greet bv-reveal bv-reveal-d2 max-w-2xl text-center">
        Welcome to <span className="bv-greet__role">{publication}</span>
      </h1>
      <p className="bv-reveal bv-reveal-d3 mt-4 max-w-md text-center text-base text-[#c3cce6]">
        Your byline is live. Taking you into the newsroom…
      </p>
      <div className="bv-reveal bv-reveal-d3 mt-8 bv-progress" role="presentation">
        <div className="bv-progress__bar" />
      </div>
    </>
  );
}

/* ── Small shared pieces ──────────────────────────────────────────────────── */

function StepDots({ step }: { step: number }) {
  return (
    <div className="bv-steps" aria-hidden>
      {[1, 2].map((n) => (
        <span key={n} className={`bv-steps__dot ${n <= step ? 'is-on' : ''} ${n === step ? 'is-cur' : ''}`} />
      ))}
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bv-field ${className ?? ''}`}>
      <div className="flex items-baseline justify-between">
        <label className="bv-label">{label}</label>
        {hint && <span className="text-[0.62rem] lowercase tracking-wide text-[--bv-ink-dim]">{hint}</span>}
      </div>
      {children}
      {error && <p className="bv-err">{error}</p>}
    </div>
  );
}

function InviteLoading() {
  return (
    <div className="bv-content">
      <div className="bv-reveal bv-halo">
        <div className="bv-halo__inner">
          <Loader2 className="h-10 w-10 animate-spin text-[--bv-blue-soft]" />
        </div>
      </div>
      <p className="bv-reveal bv-reveal-d1 mt-6 text-sm uppercase tracking-[0.2em] text-[--bv-ink-dim]">
        Verifying your invitation…
      </p>
    </div>
  );
}

function InviteNotice({
  tone,
  title,
  body,
  cta,
}: {
  tone: 'ok' | 'error';
  title: string;
  body: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="bv-content">
      <div className="bv-reveal mb-8">
        <BaalvionMark size={42} />
      </div>
      <div className="bv-card bv-reveal bv-reveal-d1 text-center">
        <div className={`mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full ${tone === 'ok' ? 'bg-[#34d39922] text-[#34d399]' : 'bg-[#f8717122] text-[#fca5a5]'}`}>
          {tone === 'ok' ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
        </div>
        <h1 className="text-xl font-semibold text-[--bv-ink]">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[--bv-ink-dim]">{body}</p>
        {cta && (
          <button type="button" className="bv-ghost-btn mx-auto mt-6" onClick={cta.onClick}>
            {cta.label} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
