import { useState } from "react";
import { Outlet, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { PageTransition } from "@/components/PageTransition";
import { OnboardingWizard } from "@/components/enterprise/OnboardingWizard";
import { DemoModeBanner } from "@/components/enterprise/DemoMode";
import { UsageWarningBanner } from "@/components/enterprise/PlanGating";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { KeyboardShortcutsModal } from "@/components/layout/KeyboardShortcutsModal";
import { useEnterprise } from "@/contexts/EnterpriseContext";
import { X, Wrench } from "lucide-react";

function MaintenanceBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-warning flex-shrink-0" />
        <span className="text-warning font-medium">Scheduled Maintenance:</span>
        <span className="text-muted-foreground">Mobile proxy pool maintenance on Feb 22, 2026 02:00–04:00 UTC. Brief connectivity interruptions may occur.{" "}
          <Link to="/status" className="text-primary hover:underline">View status page</Link>
        </span>
      </div>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function AppLayout() {
  const { isAuthenticated, isInitialized } = useAuth();
  const { onboarding } = useEnterprise();
  const showOnboarding = !onboarding.completed && !onboarding.skipped;

  if (!isInitialized) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      {showOnboarding && <OnboardingWizard />}
      <DemoModeBanner />
      <CommandPalette />
      <KeyboardShortcutsModal />
      <AppSidebar />
      <div className="pl-64 transition-all duration-300">
        <AppHeader />
        <MaintenanceBanner />
        <main className="p-6">
          <Breadcrumbs />
          <UsageWarningBanner />
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}

