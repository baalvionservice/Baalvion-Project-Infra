"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authLawApi } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authLawApi.forgotPassword(email.trim());
    } catch {
      // The endpoint is intentionally silent (never reveals whether an email exists).
    } finally {
      setLoading(false);
      setSent(true); // always show the same confirmation (no account enumeration)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1F3A] px-6 py-24">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-white/90">Law Elite Network</span>
            <h1 className="mt-4 text-2xl font-bold text-white">Reset your password</h1>
            <p className="mt-2 text-sm text-white/60">
              Enter your account email and we’ll send you a secure reset link.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <p className="text-white/80 text-sm">
                If an account exists for <strong className="text-white">{email}</strong>, a password-reset link is on its way.
                Check your inbox (and spam). The link expires in 1 hour.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-white/60">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-accent opacity-60" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@firm.com"
                    className="bg-white/5 border-white/10 text-white h-11 pl-10"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold rounded-xl">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {loading ? "SENDING..." : "SEND RESET LINK"}
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
