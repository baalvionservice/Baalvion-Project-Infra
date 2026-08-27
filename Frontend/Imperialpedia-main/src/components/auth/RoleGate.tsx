'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/design-system/layout/container';

interface RoleGateProps {
  /** Roles allowed to see `children` (matches the JWT `role` claim exposed via useAuth().user.role). */
  allow: string[];
  children: React.ReactNode;
}

/**
 * Route-level authorization gate for internal tooling sections (editor, writer,
 * creator dashboard). Reads the REAL authenticated user from `useAuth()` (backed by
 * the RS256 session, not the fabricated `useAppStore().currentUser` this used to
 * silently fall back to). `middleware.ts` already blocks fully anonymous requests at
 * the edge on the httpOnly session cookie; this adds the per-role check that
 * middleware deliberately leaves to "the API + client guards" (see its own comment).
 */
export function RoleGate({ allow, children }: RoleGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <Container className="max-w-2xl py-24 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Container>
    );
  }

  const role = user?.role;
  const isAllowed = !!role && allow.includes(role);

  if (!isAllowed) {
    return (
      <Container className="max-w-2xl py-20">
        <Card className="glass-card border-white/10 text-center">
          <CardHeader className="items-center pb-2">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold">Access restricted</CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              {user
                ? "Your account doesn't have permission to view this section."
                : 'Sign in with an account that has access to this section.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3 pt-4">
            {!user && (
              <Button onClick={() => router.push('/auth/sign-in')}>Sign in</Button>
            )}
            <Button asChild variant="outline">
              <Link href="/">Back to Imperialpedia</Link>
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return <>{children}</>;
}
