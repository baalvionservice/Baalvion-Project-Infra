"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validation/authSchema";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * @fileOverview Executive Login Form with unified Authentication protocol.
 *
 * Two ways in, one session. Password is the default; "email me a code" is passwordless
 * sign-in against the same auth-service, which mints the identical RS256 pair — so both
 * paths land on the same redirect logic and neither is a second kind of account.
 */

type Mode = "password" | "code-request" | "code-verify";

export default function LoginForm() {
  const { login, loading, requestEmailCode, loginWithCode } = useAuthContext();
  const { toast } = useToast();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("password");
  const [codeEmail, setCodeEmail] = useState("");
  // auth-service requires first/last name on the REQUEST, not the verify: the name is bound to
  // the code so a brand-new account is provisioned with the right one and it can never be
  // spoofed at verify time. Returning users retype it; that is the contract's trade-off.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  /** Where a signed-in person lands. Shared so both sign-in paths behave identically. */
  const goHome = (userRole?: string) => {
    if (userRole && ["admin", "owner", "super_admin"].includes(userRole)) router.push("/admin");
    else if (userRole === "lawyer") router.push("/lawyer/dashboard");
    else router.push("/dashboard");
  };

  const onSubmit = async (data: any) => {
    try {
      const user = await login(data.email, data.password);

      toast({
        title: "Access Granted",
        description: "Establishing secure uplink to your dashboard.",
      });

      goHome(user?.role as string | undefined);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: error.message || "Invalid credentials. Please verify your standing.",
      });
    }
  };

  const onRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await requestEmailCode(codeEmail, firstName.trim(), lastName.trim());
      setMode("code-verify");
      toast({
        title: "Code Dispatched",
        description: `A one-time code is on its way to ${codeEmail}. It expires in 5 minutes.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could Not Send Code",
        description: error.message || "Please check the address and try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const onVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await loginWithCode(codeEmail, code.trim());
      if (!user) throw new Error("That code was not accepted.");
      toast({ title: "Access Granted", description: "Establishing secure uplink to your dashboard." });
      goHome(user?.role as string | undefined);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: error.message || "Incorrect or expired code.",
      });
    } finally {
      setBusy(false);
    }
  };

  const linkClass =
    "text-[10px] font-bold uppercase tracking-widest text-accent/80 hover:text-accent transition-colors";
  const submitClass =
    "w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold shadow-lg shadow-accent/20 rounded-xl";

  if (mode === "code-request") {
    return (
      <form onSubmit={onRequestCode} className="space-y-6 w-full max-w-sm mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="code-first" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              First Name
            </Label>
            <Input
              id="code-first"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className="glass-panel border-white/10 h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code-last" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Last Name
            </Label>
            <Input
              id="code-last"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Okafor"
              className="glass-panel border-white/10 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Professional Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input
              id="code-email"
              type="email"
              required
              value={codeEmail}
              onChange={(e) => setCodeEmail(e.target.value)}
              placeholder="name@firm.com"
              className="glass-panel border-white/10 h-11 pl-10"
            />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground pt-1">
            No password needed — we&apos;ll email you a one-time code.
          </p>
        </div>

        <Button type="submit" className={submitClass} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {busy ? "SENDING CODE..." : "EMAIL ME A CODE"}
        </Button>

        <div className="text-center">
          <button type="button" onClick={() => setMode("password")} className={linkClass}>
            Use password instead
          </button>
        </div>
      </form>
    );
  }

  if (mode === "code-verify") {
    return (
      <form onSubmit={onVerifyCode} className="space-y-6 w-full max-w-sm mx-auto">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Verification Code
          </Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="glass-panel border-white/10 h-11 pl-10 tracking-[0.4em]"
            />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground pt-1">
            Sent to {codeEmail}. Expires in 5 minutes.
          </p>
        </div>

        <Button type="submit" className={submitClass} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {busy ? "VERIFYING..." : "VERIFY & CONTINUE"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setCode("");
              setMode("code-request");
            }}
            className={linkClass}
          >
            Use a different email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm mx-auto">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Professional Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
          <Input
            id="email"
            {...register("email")}
            placeholder="name@firm.com"
            className="glass-panel border-white/10 h-11 pl-10"
          />
        </div>
        {errors.email && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-1">{errors.email.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Security Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
          <Input
            id="password"
            type="password"
            {...register("password")}
            placeholder="••••••••"
            className="glass-panel border-white/10 h-11 pl-10"
          />
        </div>
        {errors.password && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-1">{errors.password.message as string}</p>}
        <div className="text-right pt-1">
          <Link href="/forgot-password" className={linkClass}>
            Forgot password?
          </Link>
        </div>
      </div>

      <Button type="submit" className={submitClass} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {loading ? "AUTHENTICATING..." : "ESTABLISH CONNECTION"}
      </Button>

      <div className="text-center">
        <button type="button" onClick={() => setMode("code-request")} className={linkClass}>
          Email me a sign-in code instead
        </button>
      </div>
    </form>
  );
}
