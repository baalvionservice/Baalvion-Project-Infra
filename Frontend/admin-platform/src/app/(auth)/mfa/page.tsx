'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const mfaSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

type MfaForm = z.infer<typeof mfaSchema>;

function MfaForm() {
  const params = useSearchParams();
  const tempToken = params.get('token') ?? '';
  const { verifyMfa, isVerifyingMfa } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MfaForm>({ resolver: zodResolver(mfaSchema) });

  const onSubmit = ({ code }: MfaForm) => {
    verifyMfa({ code, tempToken });
  };

  return (
    <div className="bv-card">
      <div className="bv-stagger flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="bv-eyebrow-row">
            <span className="bv-eyebrow">
              <span className="bv-dot-live bv-dot-live--red" />
              Second factor
            </span>
            <span className="bv-eyebrow bv-eyebrow--muted">
              <ShieldCheck className="h-3.5 w-3.5" />
              TOTP
            </span>
          </div>
          <h1 className="bv-title">Verify it&rsquo;s you</h1>
          <p className="bv-sub">Enter the 6-digit code from your authenticator app.</p>
        </div>

        <form method="post" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="bv-field">
            <label htmlFor="code" className="bv-label">Verification code</label>
            <div className="bv-input-wrap">
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
                className={`bv-input bv-input--code ${errors.code ? 'bv-input--err' : ''}`}
                {...register('code')}
              />
            </div>
            {errors.code && <p className="bv-err text-center">{errors.code.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isVerifyingMfa || !tempToken}
            className={`bv-biobtn ${isVerifyingMfa ? 'bv-biobtn--scan' : ''}`}
          >
            {isVerifyingMfa && <span className="bv-scanline" />}
            {isVerifyingMfa ? 'Verifying' : 'Verify'}
            {!isVerifyingMfa && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="bv-trust">
          <span>Encrypted session</span>
          <span>Codes rotate every 30s</span>
        </div>
      </div>
    </div>
  );
}

// useSearchParams() must sit under a Suspense boundary for the production build.
export default function MfaPage() {
  return (
    <Suspense fallback={null}>
      <MfaForm />
    </Suspense>
  );
}
