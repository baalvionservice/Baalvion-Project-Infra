import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { orgApi, Organization } from "@/lib/platformClient";
import { useAuth } from "@/contexts/AuthContext";

export type OrgPlan = "starter" | "growth" | "enterprise";

export interface OrgData {
  id: string;
  name: string;
  plan: OrgPlan;
  logo: string;
  members: number;
  bandwidthUsed: number;
  bandwidthLimit: number;
  activeProxies: number;
  successRate: number;
  avgLatency: number;
  subUsers: number;
  presets: number;
  apiKeys: number;
}

function toOrgData(org: Organization): OrgData {
  const planSlug = org.planSlug ?? "starter";
  const plan: OrgPlan =
    planSlug === "enterprise" ? "enterprise"
    : planSlug === "growth" || planSlug === "professional" ? "growth"
    : "starter";

  const initials = org.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return {
    id: org.id,
    name: org.name,
    plan,
    logo: initials,
    members: 0,
    bandwidthUsed: Math.round((org.bandwidthUsedGb ?? 0) * 1024),
    bandwidthLimit: Math.round((org.bandwidthLimitGb ?? 0) * 1024),
    activeProxies: 0,
    successRate: 0,
    avgLatency: 0,
    subUsers: 0,
    presets: 0,
    apiKeys: 0,
  };
}

const planColors: Record<OrgPlan, string> = {
  starter: "bg-muted text-muted-foreground",
  growth: "bg-primary/10 text-primary",
  enterprise: "bg-warning/10 text-warning",
};

const planLabels: Record<OrgPlan, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

interface OrgContextType {
  currentOrg: OrgData;
  allOrgs: OrgData[];
  switchOrg: (orgId: string) => void;
  planColors: Record<OrgPlan, string>;
  planLabels: Record<OrgPlan, string>;
  getOnboardingKey: () => string;
  isLoading: boolean;
  error: string | null;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

const FALLBACK_ORG: OrgData = {
  id: "",
  name: "Loading…",
  plan: "starter",
  logo: "??",
  members: 0,
  bandwidthUsed: 0,
  bandwidthLimit: 0,
  activeProxies: 0,
  successRate: 0,
  avgLatency: 0,
  subUsers: 0,
  presets: 0,
  apiKeys: 0,
};

export function OrgProvider({ children }: { children: ReactNode }) {
  // The org fetch is authenticated. AuthContext restores the in-memory access token
  // ASYNC on load (silent cookie refresh), so we MUST wait for it — otherwise this
  // request races ahead of the token, 401s, and (having no retry) leaves the switcher
  // stuck on "Loading…" forever. Re-runs when the token arrives or changes (login).
  const { accessToken, isInitialized } = useAuth();
  const [orgs, setOrgs] = useState<OrgData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string>(() => {
    return localStorage.getItem("baalvion_current_org") ?? "";
  });

  useEffect(() => {
    // Hold until the silent auth restore has settled.
    if (!isInitialized) return;
    // Not authenticated → nothing to load; stop the spinner (route guard handles redirect).
    if (!accessToken) {
      setOrgs([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    orgApi
      .get()
      .then((org) => {
        if (cancelled) return;
        const orgData = toOrgData(org);
        setOrgs([orgData]);
        setCurrentOrgId((prev) => prev || orgData.id);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message ?? "Failed to load organisation");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isInitialized, accessToken]);

  const currentOrg: OrgData =
    orgs.find((o) => o.id === currentOrgId) ?? orgs[0] ?? FALLBACK_ORG;

  const switchOrg = useCallback((orgId: string) => {
    setCurrentOrgId(orgId);
    localStorage.setItem("baalvion_current_org", orgId);
  }, []);

  const getOnboardingKey = useCallback(() => {
    return `baalvion_onboarding_${currentOrgId}`;
  }, [currentOrgId]);

  return (
    <OrgContext.Provider
      value={{
        currentOrg,
        allOrgs: orgs,
        switchOrg,
        planColors,
        planLabels,
        getOnboardingKey,
        isLoading,
        error,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
