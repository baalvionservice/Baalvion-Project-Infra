import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Crown, Mail } from "lucide-react";
import { friendlyAuthError } from "@/lib/auth-errors";

const RESEND_COOLDOWN_SECONDS = 60;
const COOLDOWN_KEY = "verify_email_resend_until";

export default function VerifyEmail() {
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Restore cooldown from localStorage so it survives reloads
  useEffect(() => {
    const until = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0);
    if (until > Date.now()) {
      setSecondsLeft(Math.ceil((until - Date.now()) / 1000));
    }
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          localStorage.removeItem(COOLDOWN_KEY);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const startCooldown = () => {
    const until = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
    localStorage.setItem(COOLDOWN_KEY, String(until));
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    if (secondsLeft > 0) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      startCooldown();
      toast.success("Verification email sent. Check your inbox.");
    } catch (err: unknown) {
      toast.error(friendlyAuthError(err, "Could not resend email"));
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || secondsLeft > 0;
  const buttonLabel = loading
    ? "Sending..."
    : secondsLeft > 0
      ? `Resend in ${secondsLeft}s`
      : "Resend verification email";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Crown className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Mail className="h-6 w-6" /> Verify your email
          </CardTitle>
          <CardDescription>
            {initialEmail
              ? `We sent a confirmation link to ${initialEmail}. Click it to activate your account.`
              : "Check your inbox for a confirmation link to activate your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resend-email">Didn't receive it? Resend to:</Label>
              <Input
                id="resend-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={disabled}>
              {buttonLabel}
            </Button>
            {secondsLeft > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                You can request another email in {secondsLeft} second{secondsLeft === 1 ? "" : "s"}.
              </p>
            )}
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/auth" className="hover:text-primary underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
