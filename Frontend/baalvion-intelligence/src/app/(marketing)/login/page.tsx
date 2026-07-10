"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    router.push("/dashboard/overview");
  }

  return (
    <div className="section-container flex min-h-[70vh] items-center justify-center py-16">
      <div className="glow-card w-full max-w-sm rounded-xl p-8">
        <h1 className="text-2xl">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your Baalvion Intelligence dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-signal-negative">{error}</p>}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Start free
          </Link>
        </p>
      </div>
    </div>
  );
}
