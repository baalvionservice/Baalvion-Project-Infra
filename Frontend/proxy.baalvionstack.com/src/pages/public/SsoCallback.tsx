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
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    if (!token) { setError(true); return; }

    // Exchange the shared auth.baalvion.com token for a REAL session on this site: the gateway
    // verifies it cryptographically and sets its own access-cookie + csrf cookie for
    // proxy.baalvionstack.com. Trusting the token's claims locally (as this used to) left nothing
    // for this site to check on reload — the browser held a token this site's own backend had
    // never seen, so any refresh logged the user right back out.
    let cancelled = false;
    (async () => {
      try {
        const tokens = await authClient.ssoExchange(token);
        if (cancelled) return;
        loginWithTokens(tokens);
        // Clear the fragment (don't leave tokens in history) and enter the app.
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/app", { replace: true });
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
