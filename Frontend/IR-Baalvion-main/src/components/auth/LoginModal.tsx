"use client";

import { useEffect, useState } from "react";
import { authService } from "@/core/services/auth.service";
import type { UserRole } from "@/core/content/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

/** Landing route per access tier after a successful login. */
const LANDING_BY_ROLE: Record<string, string> = {
  admin: "/dashboard",
  p1_institutional: "/dashboard",
  phase1: "/dashboard",
  p2_spv: "/phase2/dashboard",
  phase2: "/phase2/dashboard",
  p3_operator: "/phase3/dashboard",
  phase3: "/phase3/dashboard",
  compliance: "/dashboard",
};

/** Dev-only quick-login seed accounts (mirror src/lib/auth/local-auth.ts). */
const QUICK_ACCOUNTS: { label: string; email: string; password: string }[] = [
  { label: "Admin", email: "admin@baalvion.com", password: "Admin123!" },
  { label: "Institutional", email: "institutional@baalvion.com", password: "Investor123!" },
  { label: "Private SPV", email: "spv@baalvion.com", password: "Spv123!" },
  { label: "Operator", email: "operator@baalvion.com", password: "Operator123!" },
  { label: "Compliance", email: "compliance@baalvion.com", password: "Compliance123!" },
];

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (!open) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const redirectFor = (role: UserRole) => {
    const next =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null;
    return next && next.startsWith("/") ? next : LANDING_BY_ROLE[role] ?? "/dashboard";
  };

  const submit = async (creds: { email: string; password: string }) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { role } = await authService.login(creds.email, creds.password);
      onOpenChange(false);
      // Full navigation so middleware re-reads the new session cookie.
      window.location.href = redirectFor(role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Institutional Sign In
            </DialogTitle>
          </div>
          <DialogDescription>
            Access your investor portal, governance, and capital operations.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit({ email, password });
          }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@institution.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {isDev && (
          <div className="border-t pt-4">
            <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-muted-foreground pb-2">
              Dev quick login
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACCOUNTS.map((acc) => (
                <Button
                  key={acc.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => void submit(acc)}
                  className="text-xs"
                >
                  {acc.label}
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground pt-2">
              e.g. institutional@baalvion.com / Investor123!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default LoginModal;
