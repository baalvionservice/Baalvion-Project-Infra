"use client";

import type { User, UserRole, Plan, Subscription } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import * as api from "@/lib/api";
import {
  ctmAuthClient,
  ctmClient,
  ctmProxyClient,
  storeToken,
  clearStoredToken,
  getStoredToken,
} from "@/lib/ctm-api-client";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupDetails {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  skills?: string[];
  companyName?: string;
  companyDescription?: string;
  companyWebsite?: string;
}

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  plan: Plan | null;
  subscription: Subscription | null;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  signup: (details: SignupDetails) => Promise<AuthResult>;
  logout: () => void;
  loading: boolean;
  updateUser: (updates: Partial<User>) => void;
  acceptConsent: () => void;
  completeCandidateOnboarding: () => void;
}

interface ProxyUser {
  id: number | string;
  orgId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  mfaEnabled: boolean;
  emailVerified: boolean;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function mapRole(proxyRole: string): UserRole {
  if (proxyRole === 'candidate') return 'candidate';
  if (proxyRole === 'super_admin' || proxyRole === 'admin') return 'admin';
  return 'company';
}

function mapProxyUserToCTM(u: ProxyUser): User {
  const orgId = u.orgId && u.orgId !== 'org_demo' ? u.orgId : undefined;
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: mapRole(u.role),
    isActive: u.status === 'active',
    isVerified: !!u.emailVerified,
    companyId: orgId,
    createdAt: new Date().toISOString(),
    profile: {},
  };
}

interface CtmSubscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
}

interface CtmPlan {
  id: string;
  name: string;
  monthly_price: number;
  annual_price?: number;
  features?: Record<string, unknown>;
}

function mapCtmSubscription(s: CtmSubscription): Subscription {
  return {
    id: s.id,
    companyId: s.company_id,
    planId: s.plan_id,
    status: s.status === 'active' ? 'ACTIVE' : s.status === 'cancelled' ? 'CANCELED' : 'EXPIRED',
    startDate: s.current_period_start,
    endDate: s.current_period_end,
    billingCycle: s.billing_cycle === 'annual' ? 'YEARLY' : 'MONTHLY',
    usage: { tasksCreated: 0, submissionsReceived: 0 },
  };
}

function mapCtmPlan(p: CtmPlan): Plan {
  return {
    id: p.id,
    name: p.name,
    priceMonthly: p.monthly_price ?? 0,
    priceYearly: p.annual_price ?? (p.monthly_price ?? 0) * 10,
    limits: { tasks: -1, submissions: -1, teamMembers: -1 },
    features: [],
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Mock mode: fetch subscription + plan from mock API
  const fetchCompanyData = async (companyId: string) => {
    const [subRes, plansRes] = await Promise.all([
      api.getSubscriptionByCompany(companyId),
      api.getAllPlans(),
    ]);
    const activeSub = (subRes as any)?.data || subRes;
    const allPlans = (plansRes as any)?.data || plansRes;

    if (activeSub) {
      const currentPlan =
        allPlans?.find((p: any) => p.id === activeSub.planId) || null;
      setSubscription(activeSub);
      setPlan(currentPlan);

      if (new Date(activeSub.endDate) < new Date()) {
        const freePlan = allPlans?.find((p: any) => p.name === "Free")!;
        await api.updateSubscription(activeSub.id, { status: "EXPIRED" });
        const { data: newFreeSub } = await api.createSubscription({
          companyId,
          planId: freePlan.id,
          status: "ACTIVE",
          startDate: new Date().toISOString(),
          endDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          ).toISOString(),
          billingCycle: "YEARLY",
          usage: { tasksCreated: 0, submissionsReceived: 0 },
        });
        setSubscription(newFreeSub);
        setPlan(freePlan);
      }
    } else {
      const freePlan = allPlans?.find((p: any) => p.name === "Free")!;
      const { data: newFreeSub } = await api.createSubscription({
        companyId,
        planId: freePlan.id,
        status: "ACTIVE",
        startDate: new Date().toISOString(),
        endDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 99)
        ).toISOString(),
        billingCycle: "YEARLY",
        usage: { tasksCreated: 0, submissionsReceived: 0 },
      });
      setSubscription(newFreeSub);
      setPlan(freePlan);
    }
  };

  // Real mode: fetch subscription + plan from ctm-service
  const fetchRealCompanyData = async (companyId: string) => {
    try {
      const [subsRaw, plansRaw] = await Promise.all([
        ctmClient.get<unknown>(`/subscriptions?company_id=${companyId}`),
        ctmClient.get<unknown>('/plans'),
      ]);
      const subs: CtmSubscription[] = Array.isArray(subsRaw)
        ? subsRaw
        : ((subsRaw as any)?.data ?? []);
      const plans: CtmPlan[] = Array.isArray(plansRaw)
        ? plansRaw
        : ((plansRaw as any)?.data ?? []);

      let activeSub = subs.find((s) => s.status === 'active') ?? subs[0];

      if (activeSub) {
        // Auto-expire and reprovision if past end date
        if (activeSub.current_period_end && new Date(activeSub.current_period_end) < new Date()) {
          await ctmClient.patch(`/subscriptions/${activeSub.id}`, { status: 'expired' });
          const freePlan = plans.find((p) => p.name?.toLowerCase().includes('free')) ?? plans[0];
          if (freePlan) {
            const newSubRaw = await ctmClient.post<unknown>('/subscriptions', {
              company_id: companyId,
              plan_id: freePlan.id,
              billing_cycle: 'annual',
            });
            const newSub: CtmSubscription = (newSubRaw as any)?.data ?? newSubRaw as CtmSubscription;
            activeSub = newSub;
            setPlan(mapCtmPlan(freePlan));
          }
        } else {
          const matchedPlan = plans.find((p) => p.id === activeSub.plan_id) ?? null;
          if (matchedPlan) setPlan(mapCtmPlan(matchedPlan));
        }
        setSubscription(mapCtmSubscription(activeSub));
      } else if (plans.length > 0) {
        // No subscription exists — provision free plan
        const freePlan = plans.find((p) => p.name?.toLowerCase().includes('free')) ?? plans[0];
        const newSubRaw = await ctmClient.post<unknown>('/subscriptions', {
          company_id: companyId,
          plan_id: freePlan.id,
          billing_cycle: 'annual',
        });
        const newSub: CtmSubscription = (newSubRaw as any)?.data ?? newSubRaw as CtmSubscription;
        setSubscription(mapCtmSubscription(newSub));
        setPlan(mapCtmPlan(freePlan));
      }
    } catch {
      // Non-fatal — proceed without subscription data
    }
  };

  // Session restoration
  useEffect(() => {
    if (!USE_MOCK) {
      const token = getStoredToken();
      if (token) {
        const decoded = decodeJwtPayload(token);
        if (decoded && typeof decoded.exp === 'number' && decoded.exp * 1000 > Date.now()) {
          const ctmUser = mapProxyUserToCTM(decoded as unknown as ProxyUser);
          setUser(ctmUser);
          if (ctmUser.role === 'company' && ctmUser.companyId) {
            fetchRealCompanyData(ctmUser.companyId);
          }
          // Background refresh from /users/me
          ctmProxyClient
            .get<ProxyUser>('/users/me')
            .then((freshUser) => {
              const enriched = mapProxyUserToCTM(freshUser);
              setUser(enriched);
            })
            .catch(() => {});
        } else {
          clearStoredToken();
        }
      }
      setLoading(false);
      return;
    }

    // Mock mode session restoration
    try {
      const storedUser = localStorage.getItem("skillmatch-user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role === "company" && parsedUser.companyId) {
          fetchCompanyData(parsedUser.companyId);
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("skillmatch-user");
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUser = (updates: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = {
        ...prevUser,
        ...updates,
        profile: { ...(prevUser.profile || {}), ...updates.profile },
      };
      if (USE_MOCK) {
        localStorage.setItem("skillmatch-user", JSON.stringify(updatedUser));
        api.updateUser(prevUser.id, updates);
      }
      return updatedUser;
    });
  };

  const acceptConsent = () => {
    updateUser({ consentAccepted: true, consentAcceptedAt: new Date().toISOString() });
  };

  const completeCandidateOnboarding = () => {
    updateUser({ candidateOnboardingCompleted: true });
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    if (!USE_MOCK) {
      try {
        const result = await ctmAuthClient.post<{
          token: string;
          refreshToken: string;
          user: ProxyUser;
        }>('/login', credentials);
        storeToken(result.token);
        const ctmUser = mapProxyUserToCTM(result.user);
        setUser(ctmUser);
        if (ctmUser.role === 'company' && ctmUser.companyId) {
          await fetchRealCompanyData(ctmUser.companyId);
        }
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Login failed';
        return { success: false, message };
      }
    }

    // Mock login
    const allUsers = await api.getUsers();
    const foundUser = allUsers.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
    );
    if (foundUser) {
      if (foundUser.role === "company" && foundUser.companyId) {
        const company = await api.getCompany(foundUser.companyId);
        if (company) foundUser.companyName = company.name;
        await fetchCompanyData(foundUser.companyId);
      }
      setUser(foundUser);
      localStorage.setItem("skillmatch-user", JSON.stringify(foundUser));
      return { success: true };
    }
    return { success: false, message: "Invalid credentials." };
  };

  const signup = async (details: SignupDetails): Promise<AuthResult> => {
    if (!USE_MOCK) {
      try {
        await ctmAuthClient.post('/register', {
          email: details.email,
          password: details.password,
          name: details.name,
          role: details.role,
        });
        // Auto-login after successful registration
        const loginResult = await login({ email: details.email, password: details.password });
        if (loginResult.success && details.role === 'company' && details.companyName) {
          // Create company in ctm-service
          await ctmClient.post('/companies', {
            name: details.companyName,
            description: details.companyDescription,
            website: details.companyWebsite,
          }).catch(() => {}); // Non-fatal
        }
        return loginResult;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        if (message.includes('exists') || message.includes('already')) {
          return { success: false, message: 'An account with this email already exists.' };
        }
        return { success: false, message };
      }
    }

    // Mock signup
    const allUsers = await api.getUsers();
    if (allUsers.some((u) => u.email.toLowerCase() === details.email.toLowerCase())) {
      return { success: false, message: "An account with this email already exists." };
    }

    const userData: Omit<User, "id" | "createdAt"> = {
      name: details.name,
      email: details.email,
      role: details.role,
      isActive: true,
      candidateOnboardingCompleted: details.role === "candidate" ? false : undefined,
      onboardingCompleted: details.role === "company" ? false : undefined,
      profile: {
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/100/100`,
        skills: details.skills || [],
      },
    };

    const newUserResponse = await api.createUser(userData);
    const newUser = newUserResponse.data;
    setUser(newUser);
    localStorage.setItem("skillmatch-user", JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    if (!USE_MOCK) {
      ctmAuthClient.post('/logout', {}).catch(() => {});
      clearStoredToken();
    } else {
      localStorage.removeItem("skillmatch-user");
    }
    setUser(null);
    setPlan(null);
    setSubscription(null);
  };

  useEffect(() => {
    if (loading) return;

    const isPublicPath =
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname === "/" ||
      pathname.startsWith("/demos") ||
      pathname.startsWith("/blog") ||
      pathname.startsWith("/badges") ||
      pathname.startsWith("/companies") ||
      pathname.startsWith("/contact") ||
      pathname.startsWith("/leaderboard") ||
      pathname.startsWith("/pricing") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/terms") ||
      pathname.startsWith("/about");

    if (!user && !isPublicPath) {
      router.push("/login");
    } else if (user && isPublicPath && !pathname.startsWith("/demos")) {
      if (user.role === "company" && !user.onboardingCompleted) {
        router.push("/company/onboarding");
      } else if (user.role === "candidate" && !user.candidateOnboardingCompleted) {
        router.push("/signup/candidate/onboarding");
      } else {
        router.push(`/${user.role}/dashboard`);
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        plan,
        subscription,
        login,
        signup,
        logout,
        loading,
        updateUser,
        acceptConsent,
        completeCandidateOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
