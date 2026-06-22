import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowRight, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { authClient } from "@/lib/authClient";
import { useToast } from "@/hooks/use-toast";

type Step = "trigger" | "email" | "code";

const Spinner = () => (
  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
);

/**
 * Passwordless "Email me a login code" flow. Two steps: request a code for an email, then
 * verify it. On success it sets the session via the same path as password login and routes
 * to the dashboard. Renders collapsed by default (a single button) to keep the form compact.
 */
export function EmailOtpLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loginWithTokens } = useAuth();

  const [step, setStep] = useState<Step>("trigger");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Resend cooldown countdown — ticks down to 0 so the resend button re-enables.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const sendCode = async () => {
    setIsBusy(true);
    try {
      const res = await authClient.emailOtpRequest(email.trim());
      setSentTo(res.sentTo);
      setResendIn(res.resendAvailableInSeconds || 60);
      setStep("code");
      toast({ title: "Code sent", description: `We emailed a 6-digit code to ${res.sentTo}.` });
    } catch (err: unknown) {
      toast({
        title: "Couldn't send code",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const verifyCode = async () => {
    setIsBusy(true);
    try {
      const tokens = await authClient.emailOtpVerify(email.trim(), code.trim());
      loginWithTokens(tokens);
      toast({ title: "Welcome!", description: "Redirecting to your dashboard..." });
      navigate("/app/dashboard", { replace: true });
    } catch (err: unknown) {
      toast({
        title: "Invalid code",
        description: err instanceof Error ? err.message : "That code is incorrect or expired.",
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  if (step === "trigger") {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full mt-3 bg-muted/30 border-border/50 hover:bg-muted/50"
        onClick={() => setStep("email")}
      >
        <Mail className="w-4 h-4 mr-2" />
        Email me a login code
      </Button>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
      {step === "email" ? (
        <>
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a one-time login code — no password needed.
          </p>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              autoFocus
              placeholder="you@company.com"
              className="pl-10 bg-background border-border/50 focus:border-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && email.trim()) sendCode(); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" className="flex-1" disabled={isBusy || !email.trim()} onClick={sendCode}>
              {isBusy ? <Spinner /> : <span className="flex items-center gap-2">Send code <ArrowRight className="w-4 h-4" /></span>}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep("trigger")}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Use a different email
          </button>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to <span className="text-foreground font-medium">{sentTo}</span>.
          </p>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={8}
              placeholder="123456"
              className="pl-10 bg-background border-border/50 focus:border-primary tracking-[0.5em] font-mono text-center"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter" && code.trim().length >= 4) verifyCode(); }}
            />
          </div>
          <Button type="button" className="w-full" size="lg" disabled={isBusy || code.trim().length < 4} onClick={verifyCode}>
            {isBusy ? <Spinner /> : <span className="flex items-center gap-2">Verify &amp; sign in <ArrowRight className="w-4 h-4" /></span>}
          </Button>
          <div className="text-center">
            <button
              type="button"
              disabled={resendIn > 0 || isBusy}
              onClick={sendCode}
              className="text-sm text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default EmailOtpLogin;
