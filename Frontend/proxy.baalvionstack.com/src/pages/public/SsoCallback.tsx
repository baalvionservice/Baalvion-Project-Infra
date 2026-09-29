import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authClient } from "@/lib/authClient";

export default function SsoCallback() {
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();
  const [error, setError] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    // Two hand-off shapes land here: the raw central token in the fragment (auth.baalvion.com's
    // own sign-in redirect), or a one-time CODE in the query string (e.g. admin.baalvion.com's
    // "Open Admin" button — see authClient.ssoExchangeCode). Never both trusted at once; code
    // wins if present since it's the one that came through a query param at all deliberately.
    const code = query.get("code");
    const token = hashParams.get("token");
    if (!code && !token) { setError(true); return; }

    // `next` tells us where the caller actually meant to land (e.g. straight into /admin instead
    // of the default /app) — only honored as a same-origin path, never an absolute cross-site URL.
    const nextParam = query.get("next");
    let nextPath = "/app";
    if (nextParam) {
      try {
        const nextUrl = new URL(nextParam, window.location.origin);
        if (nextUrl.origin === window.location.origin) nextPath = nextUrl.pathname + nextUrl.search;
      } catch { /* malformed next — fall back to /app */ }
    }

    // Exchange the hand-off for a REAL session on this site: the gateway verifies it
    // cryptographically and sets its own access-cookie + csrf cookie for proxy.baalvionstack.com.
    // Trusting the token's claims locally (as this used to) left nothing for this site to check on
    // reload — the browser held a token this site's own backend had never seen, so any refresh
    // logged the user right back out.
    let cancelled = false;
    (async () => {
      try {
        const tokens = code ? await authClient.ssoExchangeCode(code) : await authClient.ssoExchange(token!);
        if (cancelled) return;
        loginWithTokens(tokens);
        // Clear the fragment/query (don't leave tokens or codes in history) and enter the app.
        window.history.replaceState(null, "", window.location.pathname);
        navigate(nextPath, { replace: true });
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [loginWithTokens, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        {error ? (
          <>
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
            <p className="font-medium">SSO sign-in failed</p>
            <button className="text-sm text-primary underline" onClick={() => navigate("/login")}>Back to login</button>
          </>
        ) : (
          <>
            <ShieldCheck className="w-8 h-8 text-primary mx-auto" />
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Completing single sign-on…</div>
          </>
        )}
      </div>
    </div>
  );
}
