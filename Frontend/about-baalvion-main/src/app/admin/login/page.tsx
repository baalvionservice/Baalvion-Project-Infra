'use client';

import { useActionState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { adminLogin } from './actions';

/**
 * Sign-in for the local admin panel.
 *
 * The server action, its HMAC session and the cookie policy already existed — and the admin
 * layout already special-cases this route (`if (pathname === '/admin/login') return children`)
 * — but the page itself was never written. So there was no way to obtain a session at all,
 * and the panel was reachable only because nothing checked the cookie.
 *
 * Now that middleware verifies that session, this is the door: without it the gate would
 * redirect administrators to a 404 and lock the panel permanently.
 *
 * Most deployments never see this screen — /admin redirects to the central Baalvion CMS
 * console whenever NEXT_PUBLIC_CMS_CONSOLE_URL is configured.
 */
export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(adminLogin, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-6 p-8">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-900">
              <ShieldCheck className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-semibold">Admin access</h1>
            <p className="text-sm text-muted-foreground">
              This panel is normally managed from the central Baalvion console.
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Passphrase</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                aria-describedby={state?.error ? 'admin-login-error' : undefined}
              />
            </div>

            {state?.error && (
              // Deliberately the action's own wording: it never says whether the passphrase
              // merely was wrong versus not configured, so this page can't leak that either.
              <p id="admin-login-error" role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
