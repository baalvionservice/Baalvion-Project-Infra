"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authLawApi } from "@/lib/api/client";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ variant: "destructive", title: "Password too short", description: "Use at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      toast({ variant: "destructive", title: "Passwords don’t match" });
      return;
    }
    setLoading(true);
    try {
      await authLawApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: err?.message || "This link may have expired. Request a new one.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1F3A] px-6 py-24">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-white/90">Law Elite Network</span>
            <h1 className="mt-4 text-2xl font-bold text-white">Choose a new password</h1>
          </div>

          {!token ? (
            <div className="text-center space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-amber-400" />
              <p className="text-white/80 text-sm">This reset link is invalid or incomplete. Please request a new one.</p>
              <Link href="/forgot-password" className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:underline">
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <p className="text-white/80 text-sm">Your password has been reset. Redirecting you to sign in…</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-white/60">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-accent opacity-60" />
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-white/5 border-white/10 text-white h-11 pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-[10px] font-bold uppercase tracking-widest text-white/60">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-accent opacity-60" />
                  <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="bg-white/5 border-white/10 text-white h-11 pl-10" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold rounded-xl">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {loading ? "RESETTING..." : "RESET PASSWORD"}
              </Button>
              <div className="text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest hover:text-white">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B1F3A]" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
