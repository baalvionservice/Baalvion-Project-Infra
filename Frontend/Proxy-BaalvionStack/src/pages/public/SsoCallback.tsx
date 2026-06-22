import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Decode a JWT payload (no verification — server already verified; this just
// extracts identity for the local session). UTF-8-safe (handles non-ASCII claims).
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(part), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export default function SsoCallback() {
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    // The refresh token now arrives ONLY via the httpOnly cookie set by the server
    // (kept out of the URL). `refresh` here stays optional for backward compatibility.
    const refresh = params.get("refresh") || "";
    if (!token) { setError(true); return; }

    const claims = decodeJwt(token);
    if (!claims) { setError(true); return; }
    // Reject an already-expired token (e.g. a stale bookmarked callback URL).
    const exp = typeof claims.exp === "number" ? claims.exp : 0;
    if (exp && exp * 1000 <= Date.now()) { setError(true); return; }

    loginWithTokens({
      accessToken: token,
      refreshToken: refresh,
      user: {
        id: String(claims.sub ?? ""),
        email: String(claims.email ?? ""),
        fullName: String(claims.email ?? "").split("@")[0],
        avatarUrl: null,
        status: "active",
        emailVerified: true,
        mfaEnabled: false,
        role: claims.role as string | undefined,
        // Canonical Baalvion tokens carry `org_id`; older tokens used `organizationId`.
        orgId: (claims.organizationId ?? claims.org_id) as string | undefined,
      },
    });
    // Clear the fragment (don't leave tokens in history) and enter the app.
    window.history.replaceState(null, "", window.location.pathname);
    navigate("/app", { replace: true });
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
