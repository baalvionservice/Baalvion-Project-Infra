import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Crown, AlertCircle, CheckCircle2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { friendlyAuthError } from "@/lib/auth-errors";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The reset link carries a one-time token (?token=...) issued by
  // /auth/forgot-password.
  const token = searchParams.get("token") || "";

  useEffect(() => {
    setHasRecoverySession(!!token);
  }, [token]);

  const validate = () => {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must include a number.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.resetPasswordWithToken(token, password);
      if (updateError) throw updateError;
      setDone(true);
      toast.success("Password updated. Please sign in.");
      setTimeout(() => navigate("/auth"), 1500);
    } catch (err: unknown) {
      console.error("Update password error:", err);
      setError(friendlyAuthError(err, "Could not update password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Crown className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set a new password</CardTitle>
          <CardDescription>
            Choose a strong password to secure your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-3 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Your password has been updated. Redirecting to sign in…
              </p>
            </div>
          ) : !hasRecoverySession ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This password reset link is invalid or has expired. Request a new one from the
                forgot-password page.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Must be 8+ characters with uppercase, lowercase, and numbers
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <PasswordInput
                  id="confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
