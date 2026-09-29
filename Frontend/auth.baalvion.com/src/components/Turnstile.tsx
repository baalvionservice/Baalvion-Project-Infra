'use client';

import { useEffect, useRef } from 'react';

// Cloudflare Turnstile site key. When unset (local dev), the widget is skipped entirely and the
// parent treats the captcha as satisfied — mirrors the server, which only enforces when a secret
// is configured.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
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
  /** 'auto' | 'dark' | 'light' — matched to the active brand mode. */
  theme?: 'auto' | 'dark' | 'light';
  onToken: (token: string) => void;
  onExpire?: () => void;
}

/** Renders the Turnstile widget and reports its token. Renders null when no site key is set. */
export function Turnstile({ theme = 'auto', onToken, onExpire }: TurnstileProps) {
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
          theme,
          callback: (token: string) => onToken(token),
          'expired-callback': () => onExpire?.(),
          'error-callback': () => onExpire?.(),
        });
      })
      .catch(() => {
        /* load failure: parent's submit will surface a captcha error from the server */
      });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* already gone */
        }
      }
    };
  }, [theme, onToken, onExpire]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="turnstile" aria-label="Human verification" />;
}

/** Whether a captcha is required at all (server enforces independently). */
export const captchaEnabled = !!SITE_KEY;
