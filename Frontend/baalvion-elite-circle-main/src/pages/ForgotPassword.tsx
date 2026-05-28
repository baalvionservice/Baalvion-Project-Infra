import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Crown, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  // Dev convenience: with no email service wired, the backend returns the reset
  // token so the flow can be completed in the browser.
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      if ((data as any)?.reset_token) {
        setDevResetUrl(`${window.location.origin}/reset-password?token=${(data as any).reset_token}`);
      }
      setSent(true);
      toast.success("If that account exists, a reset link is on its way.");
    } catch (err: any) {
      console.error("Reset error:", err);
      // Always show generic success to avoid email enumeration
      setSent(true);
      toast.success("If that account exists, a reset link is on its way.");
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
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Check your inbox at <span className="font-medium text-foreground">{email}</span> for a password reset link.
              </p>
              {devResetUrl && (
                <div className="rounded-md border border-dashed border-primary/40 p-3 text-left">
                  <p className="text-xs text-muted-foreground mb-1">Dev mode (no email configured) — use this link:</p>
                  <a href={devResetUrl} className="text-xs text-primary break-all underline-offset-2 hover:underline">
                    {devResetUrl}
                  </a>
                </div>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link to="/auth"><ArrowLeft className="h-4 w-4 mr-2" />Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/auth"><ArrowLeft className="h-4 w-4 mr-2" />Back to sign in</Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
