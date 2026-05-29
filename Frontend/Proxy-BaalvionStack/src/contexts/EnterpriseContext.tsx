import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { tokenStore } from "@/lib/tokenStore";

// User Roles — extended for RBAC
export type UserRole = "owner" | "admin" | "support" | "finance" | "viewer" | "restricted";

// Plan Types
export type PlanType = "free" | "starter" | "pro" | "enterprise";

// Demo Mode State
export interface DemoModeState {
  enabled: boolean;
  dataset: "standard" | "enterprise";
}

// Onboarding State
export interface OnboardingState {
  completed: boolean;
  skipped: boolean;
  currentStep: number;
  useCase: string | null;
  proxyType: string | null;
  firstProxy: boolean;
}

// Usage State
export interface UsageState {
  bandwidthUsed: number;
  bandwidthLimit: number;
  proxiesCreated: number;
  subUsersCreated: number;
  presetsCreated: number;
  hasAnalyticsData: boolean;
}

interface EnterpriseContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  hasPermission: (action: string) => boolean;
  currentPlan: PlanType;
  setCurrentPlan: (plan: PlanType) => void;
  isPlanFeatureAvailable: (feature: string) => boolean;
  getUpgradeMessage: (feature: string) => string;
  demoMode: DemoModeState;
  toggleDemoMode: () => void;
  resetDemoData: () => void;
  onboarding: OnboardingState;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  updateOnboardingData: (data: Partial<OnboardingState>) => void;
  restartOnboarding: () => void;
  usage: UsageState;
  updateUsage: (data: Partial<UsageState>) => void;
  getUsageWarningLevel: () => "normal" | "warning" | "critical" | "exceeded";
  showTour: boolean;
  setShowTour: (show: boolean) => void;
  tourStep: number;
  setTourStep: (step: number) => void;
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

// Permission matrix by role — extended
const rolePermissions: Record<UserRole, string[]> = {
  owner: ["create", "edit", "delete", "manage_users", "manage_billing", "view_analytics", "export", "manage_api_keys", "view_proxies", "manage_proxies"],
  admin: ["create", "edit", "delete", "manage_users", "view_analytics", "export", "manage_api_keys", "view_proxies", "manage_proxies"],
  support: ["view_analytics", "view_proxies", "export"], // no billing, no proxy editing
  finance: ["manage_billing", "view_analytics", "export"], // billing only
  viewer: ["view_analytics", "view_proxies"], // read-only
  restricted: ["view_proxies"], // limited proxy types only
};

// Plan features matrix
const planFeatures: Record<PlanType, string[]> = {
  free: ["basic_proxies", "limited_bandwidth"],
  starter: ["basic_proxies", "limited_bandwidth", "sub_users_1", "presets"],
  pro: ["basic_proxies", "unlimited_bandwidth", "sub_users_5", "presets", "analytics", "api_keys", "priority_support"],
  enterprise: ["basic_proxies", "unlimited_bandwidth", "sub_users_unlimited", "presets", "analytics", "api_keys", "priority_support", "dedicated_ips", "custom_integration", "sla"],
};

const planLimits: Record<PlanType, { bandwidth: number; subUsers: number; proxies: number }> = {
  free: { bandwidth: 1024, subUsers: 0, proxies: 10 },
  starter: { bandwidth: 10240, subUsers: 1, proxies: 100 },
  pro: { bandwidth: 102400, subUsers: 5, proxies: 1000 },
  enterprise: { bandwidth: Infinity, subUsers: Infinity, proxies: Infinity },
};

export function EnterpriseProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    // P0: role comes from the VERIFIED session (JWT claim), NEVER localStorage. Least-privilege
    // default until the backend membership role is known. API authorization remains authoritative;
    // this role only drives UX gating.
    const valid: UserRole[] = ["owner", "admin", "support", "finance", "viewer", "restricted"];
    const sessionRole = tokenStore.getUser()?.role as UserRole | undefined;
    return sessionRole && valid.includes(sessionRole) ? sessionRole : "viewer";
  });

  const [currentPlan, setCurrentPlan] = useState<PlanType>(() => {
    const saved = localStorage.getItem("baalvion_user_plan");
    return (saved as PlanType) || "pro";
  });

  const [demoMode, setDemoMode] = useState<DemoModeState>(() => {
    const saved = localStorage.getItem("baalvion_demo_mode");
    return saved ? JSON.parse(saved) : { enabled: false, dataset: "standard" };
  });

  const [onboarding, setOnboarding] = useState<OnboardingState>(() => {
    const saved = localStorage.getItem("baalvion_onboarding");
    return saved ? JSON.parse(saved) : {
      completed: false, skipped: false, currentStep: 0,
      useCase: null, proxyType: null, firstProxy: false,
    };
  });

  const [usage, setUsage] = useState<UsageState>(() => {
    const saved = localStorage.getItem("baalvion_usage");
    const limits = planLimits[currentPlan];
    return saved ? JSON.parse(saved) : {
      bandwidthUsed: 0, bandwidthLimit: limits.bandwidth,
      proxiesCreated: 0, subUsersCreated: 0, presetsCreated: 0, hasAnalyticsData: false,
    };
  });

  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // (Removed: the role is never persisted to localStorage — it is derived from the verified session.)
  useEffect(() => {
    localStorage.setItem("baalvion_user_plan", currentPlan);
    const limits = planLimits[currentPlan];
    setUsage(prev => ({ ...prev, bandwidthLimit: limits.bandwidth }));
  }, [currentPlan]);
  useEffect(() => { localStorage.setItem("baalvion_demo_mode", JSON.stringify(demoMode)); }, [demoMode]);
  useEffect(() => { localStorage.setItem("baalvion_onboarding", JSON.stringify(onboarding)); }, [onboarding]);
  useEffect(() => { localStorage.setItem("baalvion_usage", JSON.stringify(usage)); }, [usage]);

  const hasPermission = (action: string): boolean => rolePermissions[currentRole].includes(action);

  const isPlanFeatureAvailable = (feature: string): boolean => planFeatures[currentPlan].includes(feature);

  const getUpgradeMessage = (feature: string): string => {
    const featureMessages: Record<string, string> = {
      sub_users: "Upgrade to Starter to add sub-users",
      analytics: "Upgrade to Pro for advanced analytics",
      api_keys: "Upgrade to Pro for API key management",
      dedicated_ips: "Upgrade to Enterprise for dedicated IPs",
      custom_integration: "Upgrade to Enterprise for custom integrations",
      unlimited_bandwidth: "Upgrade to Pro for unlimited bandwidth",
    };
    return featureMessages[feature] || "Upgrade to unlock this feature";
  };

  const toggleDemoMode = () => {
    setDemoMode(prev => ({ enabled: !prev.enabled, dataset: !prev.enabled ? "enterprise" : "standard" }));
    if (!demoMode.enabled) {
      setUsage({ bandwidthUsed: 85000, bandwidthLimit: 102400, proxiesCreated: 847, subUsersCreated: 12, presetsCreated: 24, hasAnalyticsData: true });
    } else {
      const limits = planLimits[currentPlan];
      setUsage({ bandwidthUsed: 0, bandwidthLimit: limits.bandwidth, proxiesCreated: 0, subUsersCreated: 0, presetsCreated: 0, hasAnalyticsData: false });
    }
  };

  const resetDemoData = () => {
    if (demoMode.enabled) {
      setUsage({ bandwidthUsed: 85000, bandwidthLimit: 102400, proxiesCreated: 847, subUsersCreated: 12, presetsCreated: 24, hasAnalyticsData: true });
    }
  };

  const setOnboardingStep = (step: number) => setOnboarding(prev => ({ ...prev, currentStep: step }));
  const completeOnboarding = () => setOnboarding(prev => ({ ...prev, completed: true, currentStep: 5 }));
  const skipOnboarding = () => setOnboarding(prev => ({ ...prev, skipped: true, completed: true }));
  const updateOnboardingData = (data: Partial<OnboardingState>) => setOnboarding(prev => ({ ...prev, ...data }));
  const restartOnboarding = () => setOnboarding({ completed: false, skipped: false, currentStep: 0, useCase: null, proxyType: null, firstProxy: false });

  const updateUsage = (data: Partial<UsageState>) => setUsage(prev => ({ ...prev, ...data }));

  const getUsageWarningLevel = (): "normal" | "warning" | "critical" | "exceeded" => {
    const percentage = (usage.bandwidthUsed / usage.bandwidthLimit) * 100;
    if (percentage >= 100) return "exceeded";
    if (percentage >= 90) return "critical";
    if (percentage >= 80) return "warning";
    return "normal";
  };

  return (
    <EnterpriseContext.Provider
      value={{
        currentRole, setCurrentRole, hasPermission,
        currentPlan, setCurrentPlan, isPlanFeatureAvailable, getUpgradeMessage,
        demoMode, toggleDemoMode, resetDemoData,
        onboarding, setOnboardingStep, completeOnboarding, skipOnboarding, updateOnboardingData, restartOnboarding,
        usage, updateUsage, getUsageWarningLevel,
        showTour, setShowTour, tourStep, setTourStep,
      }}
    >
      {children}
    </EnterpriseContext.Provider>
  );
}

export function useEnterprise() {
  const context = useContext(EnterpriseContext);
  if (!context) throw new Error("useEnterprise must be used within an EnterpriseProvider");
  return context;
}