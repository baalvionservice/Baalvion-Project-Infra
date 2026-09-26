"use client";

import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";

/**
 * Was a complete fake: the form only ran a setTimeout and then told the user
 * "We've sent a password reset link" — no backend call, and no password-reset
 * endpoint exists anywhere in auth-service to call. No email was ever sent.
 * Removed rather than left lying to locked-out users; routes them to the real,
 * working contact form instead. See the mock-data remediation report and
 * FeatureUnavailable's doc comment for the site's real-data-first policy.
 */
export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <Container className="w-full max-w-md">
        <div className="space-y-8 text-center">
          <Link href="/" className="inline-block">
            <Text variant="h2" className="text-2xl font-bold text-primary">
              Imperialpedia
            </Text>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-card/40 p-8 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <Text variant="h1" as="h1" className="text-2xl font-bold tracking-tight">
              Password reset isn&apos;t available yet
            </Text>
            <Text variant="body" className="text-muted-foreground">
              Self-service password reset isn&apos;t connected to a live email service yet.
              Contact us and we&apos;ll help you regain access to your account.
            </Text>
            <Button asChild className="w-full rounded-xl font-bold h-12 mt-2">
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>

          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </Container>
    </main>
  );
}
