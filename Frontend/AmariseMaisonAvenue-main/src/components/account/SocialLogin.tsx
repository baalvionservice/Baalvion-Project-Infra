'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  startOAuthLogin,
  oauthErrorMessage,
  ENABLED_OAUTH_PROVIDERS,
  OAUTH_PROVIDER_LABELS,
  type OAuthProvider,
} from '@/lib/oauth';

/**
 * "Or continue with" social-login block for the public account pages (login / register).
 *
 * Self-contained: it derives the return path from the current route, kicks off the
 * provider redirect, and — when the browser lands back here — either forwards the
 * now-authenticated visitor into the member area (?oauth=ok) or surfaces a failure
 * (?oauth_error=<code>). It deliberately does NOT call authClient.bootstrap(): the
 * member area's AuthProvider restores the session once on mount, and a second
 * /refresh here would trip refresh-token reuse detection.
 */

/** Only follow a same-site relative path (no open redirect to //evil.com). */
function safeRelative(path: string | null, fallback: string): string {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : fallback;
}

export function SocialLogin() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { country } = useParams();
  const countryCode = (country as string) || 'us';

  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);

  // Handle the redirect back from the provider flow.
  useEffect(() => {
    const errCode = searchParams.get('oauth_error');
    const ok = searchParams.get('oauth');

    if (errCode) {
      setError(oauthErrorMessage(errCode));
      // Strip the marker so a refresh / re-render doesn't repeat the message.
      const next = new URLSearchParams(searchParams.toString());
      next.delete('oauth_error');
      next.delete('oauth');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
      return;
    }

    if (ok === 'ok') {
      // Session cookie is set; forward into the member area, which restores it once.
      setRedirecting(true);
      const target = safeRelative(searchParams.get('redirect'), `/${countryCode}/account`);
      router.replace(target);
    }
  }, [searchParams, pathname, countryCode, router]);

  const handleClick = (provider: OAuthProvider) => {
    setError(null);
    setPendingProvider(provider);
    // Preserve any deep-link redirect so social sign-in lands on the originally requested page.
    const redirect = safeRelative(searchParams.get('redirect'), '');
    const returnTo = redirect ? `${pathname}?redirect=${encodeURIComponent(redirect)}` : pathname;
    startOAuthLogin(provider, returnTo);
  };

  if (!ENABLED_OAUTH_PROVIDERS.length) return null;

  if (redirecting) {
    return (
      <div className="flex items-center justify-center gap-3 py-6 text-[11px] font-bold tracking-[0.2em] uppercase text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        Signing you in…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-[10px] font-bold tracking-[0.25em] uppercase text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {ENABLED_OAUTH_PROVIDERS.map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => handleClick(provider)}
            disabled={!!pendingProvider}
            aria-label={`Continue with ${OAUTH_PROVIDER_LABELS[provider]}`}
            className="w-full h-12 flex items-center justify-center gap-3 border border-gray-200 bg-white rounded-none text-[11px] font-bold tracking-[0.2em] uppercase text-gray-900 hover:border-black hover:bg-gray-50 transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:opacity-60"
          >
            {pendingProvider === provider ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <ProviderIcon provider={provider} />
            )}
            <span>{OAUTH_PROVIDER_LABELS[provider]}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-[12px] font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ProviderIcon({ provider }: { provider: OAuthProvider }) {
  if (provider === 'google') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.66-2.07.84-.77z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    );
  }
  // Facebook
  return (
    <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
