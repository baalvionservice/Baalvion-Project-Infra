# Wiring a Baalvion site into the shared auth surface

Every Baalvion site delegates sign-in/sign-up to **`auth.baalvion.com`** (this app). A site only needs
two things: a **"Sign in" link** out to the auth surface, and an **`/auth/sso-callback`** handler to
receive the session on the way back. The auth surface renders in that site's own theme, so it feels
native — not a separate login page.

## 1. The sign-in link

Point every "Sign in" / "Create account" control at:

```
https://auth.baalvion.com/?brand=<slug>&return_to=<absolute-url-the-user-is-on>
```

- `brand` — the theme slug for this site (see `src/lib/themes.ts`). If omitted, the theme is inferred
  from the `return_to` hostname.
- `return_to` — the **absolute** URL to come back to. Must be an `https://*.baalvion.com` (or an
  allow-listed apex) URL or it is rejected (open-redirect guard).

Example (React/Next):

```tsx
const authUrl = `https://auth.baalvion.com/?brand=about&return_to=${encodeURIComponent(window.location.href)}`;
<a href={authUrl}>Sign in</a>
```

## 2. The `/auth/sso-callback` handler

After verification the auth surface redirects to:

```
<your-site>/auth/sso-callback?next=<return_to>#token=<accessToken>
```

The **access token is in the URL hash** (never sent to a server/log). The **refresh cookie is already
set** on `.baalvion.com` by the auth-service, so your site's existing `/auth-bff/refresh` keeps the
session alive. The callback just needs to capture the access token and continue.

### Next.js (App Router) — `src/app/auth/sso-callback/page.tsx`

```tsx
'use client';
import { useEffect } from 'react';

export default function SsoCallback() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get('token');
    const next = new URLSearchParams(window.location.search).get('next') || '/';
    if (token) {
      // Hand the access token to however this site holds its session (memory store / context /
      // a short-lived cookie). The shared refresh cookie does the rest.
      sessionStorage.setItem('baalvion_access', token);
    }
    window.location.replace(next);
  }, []);
  return <p style={{ padding: 24 }}>Signing you in…</p>;
}
```

### Vite SPA — `public/auth/sso-callback.html` (or a route)

Mirror the above: parse `location.hash` for `token`, stash it, then `location.replace(next)`.

> Several sites already ship an `/auth/sso-callback#token=` handler (it was added for social login).
> Reuse it — the token shape is identical.

## 3. Add the brand theme

If this site is not yet in `src/lib/themes.ts`, add one entry with its design tokens (colors, fonts,
radius) pulled from the site's own Tailwind config / globals. The shared form will then render in the
site's exact look. Also add its hostname to `HOST_BRAND` so the theme is inferred even without
`?brand=`.

## 4. Allow-list the return host (non-baalvion.com only)

`*.baalvion.com` is always allowed. For a different apex (e.g. `amarisemaisonavenue.com`), add it to
`NEXT_PUBLIC_ALLOWED_RETURN_HOSTS` on this app.

## Server prerequisites (one-time, operator)

- `auth-service`: `REFRESH_COOKIE_DOMAIN=.baalvion.com`, `TURNSTILE_SECRET_KEY=…`, SMTP configured,
  migrations `012` + `013` applied.
- this app: `AUTH_SERVICE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, DNS `auth.baalvion.com`.
