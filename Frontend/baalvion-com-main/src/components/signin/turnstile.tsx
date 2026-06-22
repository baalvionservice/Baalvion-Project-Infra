'use client';

import { useEffect, useRef } from 'react';

// Cloudflare Turnstile site key, inlined at build time. When unset (e.g. local preview), the widget
// is skipped and the parent treats the captcha as satisfied — mirrors the server, which only
// enforces when a secret is configured.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id?: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile_load_failed'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface TurnstileProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
}

export function Turnstile({ onToken, onExpire }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    let cancelled = false;
    const el = ref.current;

    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile || !el) return;
        widgetId.current = window.turnstile.render(el, {
          sitekey: SITE_KEY,
          theme: 'dark',
          callback: (token: string) => onToken(token),
          'expired-callback': () => onExpire?.(),
          'error-callback': () => onExpire?.(),
        });
      })
      .catch(() => {
        /* load failure surfaces as a server-side captcha error on submit */
      });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* already removed */
        }
      }
    };
  }, [onToken, onExpire]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="mt-1" aria-label="Human verification" />;
}

export const captchaEnabled = !!SITE_KEY;
