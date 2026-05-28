import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { friendlyAuthError } from "@/lib/auth-errors";

type Status = "loading" | "success" | "error";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    // The self-hosted backend signs users in directly (no OAuth / email-link
    // exchange), so this callback simply routes based on the current session.
    const run = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setStatus("success");
        setTimeout(() => navigate(data.session ? "/dashboard" : "/auth", { replace: true }), 1200);
      } catch (err: unknown) {
        setErrorMsg(friendlyAuthError(err, "Verification failed"));
        setStatus("error");
      }
    };
    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Crown className="h-12 w-12 text-primary" />
          </div>
          {status === "loading" && (
            <>
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" /> Verifying…
              </CardTitle>
              <CardDescription>Confirming your email address.</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <CardTitle className="text-2xl flex items-center justify-center gap-2 text-primary">
                <CheckCircle2 className="h-6 w-6" /> Email verified
              </CardTitle>
              <CardDescription>Redirecting you now…</CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <CardTitle className="text-2xl flex items-center justify-center gap-2 text-destructive">
                <XCircle className="h-6 w-6" /> Verification failed
              </CardTitle>
              <CardDescription>{errorMsg}</CardDescription>
            </>
          )}
        </CardHeader>
        {status === "error" && (
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/auth/verify-email">Resend verification email</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
