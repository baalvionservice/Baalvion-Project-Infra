"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center py-12 md:px-4">
        <Container className="w-full max-w-md">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <Link href="/" className="inline-block">
                <Text variant="h2" className="text-2xl font-bold text-primary">
                  Imperialpedia
                </Text>
              </Link>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <Text
                  variant="h1"
                  className="text-3xl font-bold tracking-tight"
                >
                  Check your email
                </Text>
                <Text variant="body" className="text-muted-foreground">
                  We've sent a password reset link to
                </Text>
                <Text variant="body" className="font-medium">
                  {email}
                </Text>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-card/40 md:p-8 space-y-6">
              <div className="space-y-4 text-center">
                <Text variant="bodySmall" className="text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try again.
                </Text>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="w-full rounded-xl font-medium"
                >
                  Try different email
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <Container className="w-full max-w-md">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Link href="/" className="inline-block">
              <Text variant="h2" className="text-2xl font-bold text-primary">
                Imperialpedia
              </Text>
            </Link>
            <div className="space-y-2">
              <Text variant="h1" className="text-3xl font-bold tracking-tight">
                Forgot password?
              </Text>
              <Text variant="body" className="text-muted-foreground">
                Enter your email and we'll send you a reset link
              </Text>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-card/40 p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
                  <Text
                    variant="bodySmall"
                    className="text-destructive font-medium"
                  >
                    {error}
                  </Text>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your email"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full rounded-xl font-bold h-12"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending reset link...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Send reset link
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </div>

          {/* Back to Sign In */}
          <div className="text-center">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
