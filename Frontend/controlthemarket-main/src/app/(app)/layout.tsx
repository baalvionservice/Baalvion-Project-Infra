"use client";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { ConsentModal } from "@/components/consent-modal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      return; // AuthProvider will handle the redirect to login.
    }

    // Onboarding check for company users
    if (
      user.role === "company" &&
      !user.onboardingCompleted &&
      !pathname.startsWith("/company/onboarding")
    ) {
      router.replace("/company/onboarding");
      return; // Redirect and stop further checks
    }

    // Onboarding check for candidate users
    if (
      user.role === "candidate" &&
      !user.candidateOnboardingCompleted &&
      !pathname.startsWith("/signup/candidate")
    ) {
      router.replace("/signup/candidate/onboarding");
      return;
    }

    // If the user is on the base '/dashboard' path, redirect them to their specific role's dashboard.
    if (pathname === "/dashboard") {
      router.replace(`/${user.role}/dashboard`);
      return;
    }

    // Check if user is on the correct role path
    const userRolePrefix = `/${user.role}`;
    const isOnCorrectRolePath = pathname.startsWith(userRolePrefix);
    const isOnOnboardingPath =
      pathname.startsWith("/company/onboarding") ||
      pathname.startsWith("/signup/candidate");

    // If the user is on a path that does not belong to their role (and not in onboarding), redirect them.
    if (!isOnCorrectRolePath && !isOnOnboardingPath) {
      // Special case: if candidate has not consented, don't redirect them away from the page that triggers the modal
      if (user.role === "candidate" && !user.consentAccepted) {
        return;
      }
      router.replace(`/${user.role}/dashboard`);
    }
  }, [user, loading, pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user.role === "candidate" && !user.consentAccepted) {
    return <ConsentModal />;
  }

  // To prevent content flashing while redirecting, we can show a loading state
  // if the current path is not yet the correct one for the user's role.
  const isCorrectPath =
    pathname.startsWith(`/${user.role}`) ||
    pathname === "/dashboard" ||
    pathname.startsWith("/company/onboarding") ||
    pathname.startsWith("/signup/candidate");
  if (!isCorrectPath) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Don't show sidebar during onboarding
  if (
    pathname.startsWith("/company/onboarding") ||
    pathname.startsWith("/signup/candidate/onboarding")
  ) {
    return <main>{children}</main>;
  }

  return <DashboardSidebar>{children}</DashboardSidebar>;
}
