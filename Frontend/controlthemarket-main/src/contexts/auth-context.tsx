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
  bootstrapSession,
} from "@/lib/ctm-api-client";

// SECURITY (P0): REAL auth by default. Mock is a DEV-ONLY opt-in and can NEVER activate in
// production — `process.env.NODE_ENV` is inlined at build time so the mock branches below are
// dead-code-eliminated from production bundles.
const USE_MOCK =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// Build-time safety net: fail loudly if anyone tries to force mock auth in a production build.
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
  throw new Error('[CTM] Refusing to start: mock auth (NEXT_PUBLIC_USE_MOCK=true) is forbidden in production.');
}

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
  loginWithOtp: (email: string, code: string) => Promise<AuthResult>;
  signup: (details: SignupDetails) => Promise<AuthResult>;
  logout: () => void;
  loading: boolean;
  updateUser: (updates: Partial<User>) => void;
  acceptConsent: () => void;
  completeCandidateOnboarding: () => void;
}

// Accepts both the old auth-service shape and the gateway BFF shape.
interface ProxyUser {
  // old shape (direct auth-service)
  id?: number | string;
  name?: string;
  role?: string;
  status?: string;
  mfaEnabled?: boolean;
  emailVerified?: boolean;
  // gateway BFF shape (cookie-only, no token)
  userId?: number | string;
  fullName?: string;
  roles?: string[];
  permissions?: string[];
  sessionId?: string;
  // shared
  orgId?: string | null;
  email?: string;
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

function mapRole(proxyRole: string | undefined): UserRole {
  if (!proxyRole) return 'company';
  if (proxyRole === 'candidate') return 'candidate';
  if (proxyRole === 'super_admin' || proxyRole === 'admin' || proxyRole === 'platform_admin') return 'admin';
  return 'company';
}

function mapRoles(roles: string[] | undefined, role: string | undefined): UserRole {
  // Gateway BFF sends roles[] (array); old auth-service sends role (string).
  if (roles && roles.length > 0) {
    if (roles.includes('candidate')) return 'candidate';
    if (roles.some((r) => ['admin', 'super_admin', 'platform_admin'].includes(r))) return 'admin';
  }
  return mapRole(role);
}

function mapProxyUserToCTM(u: ProxyUser): User {
  // Normalise id: gateway uses userId, old auth-service uses id.
  const rawId = u.id ?? u.userId;
  // Normalise name: gateway uses fullName, old auth-service uses name.
  const rawName = u.name ?? u.fullName ?? u.email ?? 'User';
  const orgId = u.orgId && u.orgId !== 'org_demo' ? u.orgId : undefined;
  return {
    id: String(rawId),
    name: rawName,
    email: u.email ?? '',
    role: mapRoles(u.roles, u.role),
    isActive: u.status !== 'inactive',
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

// Mirror the gateway identity into ctm-service (user_profiles) so admin user lists,
// leaderboards and public profiles carry real name/email. Client-side, non-fatal.
// NOTE: role is only sent when `includeRole` is true (signup) — on login we must NOT
// clobber the app-role stored in the profile, since the identity service issues every
// user the org role 'owner' (no candidate/admin concept).
function mirrorCtmProfile(u: User, includeRole = false) {
  ctmClient
    .post('/users', {
      id: u.id,
      name: u.name,
      email: u.email,
      ...(includeRole ? { role: u.role } : {}),
      company_id: u.companyId,
      avatar_url: u.profile?.avatarUrl,
      is_verified: u.isVerified,
    })
    .catch(() => { /* non-fatal */ });
}

// The app-role (candidate | company | admin) AND the onboarding/consent flags are the
// source of truth in the ctm profile, NOT the identity JWT (which only carries org role
// 'owner' and no app state). Fetch the full profile after auth and merge it onto the user
// — critically including the onboarding flags, else the redirect guard bounces the user
// to onboarding forever.
async function fetchCtmProfileFields(userId: string): Promise<Partial<User> | null> {
  try {
    const p = await ctmProxyClientCtmProfile(userId);
    if (!p) return null;
    return {
      role: (p.role as UserRole) || undefined,
      companyId: p.company_id ?? p.companyId ?? undefined,
      name: p.name || undefined,
      isVerified: !!p.is_verified,
      onboardingCompleted: p.onboarding_completed ?? undefined,
      candidateOnboardingCompleted: p.candidate_onboarding_completed ?? undefined,
      consentAccepted: !!p.consent_accepted,
      consentAcceptedAt: p.consent_accepted_at ?? undefined,
      profile: {
        avatarUrl: p.avatar_url ?? undefined,
        bio: p.bio ?? undefined,
        location: p.location ?? undefined,
        experienceLevel: p.experience_level ?? undefined,
        skills: Array.isArray(p.skills) ? p.skills : undefined,
        githubUrl: p.github_url ?? undefined,
        linkedinUrl: p.linkedin_url ?? undefined,
        portfolioLinks: Array.isArray(p.portfolio_links) ? p.portfolio_links : undefined,
      },
    };
  } catch {
    return null;
  }
}

// Merge ctm profile fields onto the identity-derived user.
function applyProfile(ctmUser: User, prof: Partial<User> | null): void {
  if (!prof) return;
  if (prof.role) ctmUser.role = prof.role;
  if (prof.companyId) ctmUser.companyId = prof.companyId;
  if (prof.name) ctmUser.name = prof.name;
  if (prof.isVerified !== undefined) ctmUser.isVerified = prof.isVerified;
  if (prof.onboardingCompleted !== undefined) ctmUser.onboardingCompleted = prof.onboardingCompleted;
  if (prof.candidateOnboardingCompleted !== undefined) ctmUser.candidateOnboardingCompleted = prof.candidateOnboardingCompleted;
  if (prof.consentAccepted !== undefined) ctmUser.consentAccepted = prof.consentAccepted;
  if (prof.consentAcceptedAt) ctmUser.consentAcceptedAt = prof.consentAcceptedAt;
  if (prof.profile) ctmUser.profile = { ...(ctmUser.profile || {}), ...prof.profile };
}

// GET /users/:id off ctm-service (optionalAuth — works without a bearer token).
async function ctmProxyClientCtmProfile(userId: string): Promise<any> {
  return ctmClient.get<any>(`/users/${userId}`);
}

// Server components (the company dashboard pages) can't read the in-memory auth state,
// so we mirror the current user/company into readable cookies they can pick up via
// next/headers cookies(). Not secrets — just ids for scoping the demo.
function setCtmScopeCookies(u: User | null) {
  if (typeof document === 'undefined') return;
  // Add Secure on HTTPS so the cookies are not sent over clear-text; omit it on
  // local http dev where Secure would silently drop the cookie. SameSite stays
  // on both the set and clear paths.
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; secure' : '';
  if (u) {
    const opts = `; path=/; max-age=2592000; samesite=lax${secure}`;
    document.cookie = `ctm_user_id=${encodeURIComponent(u.id)}${opts}`;
    document.cookie = `ctm_company_id=${encodeURIComponent(u.companyId || '')}${opts}`;
    document.cookie = `ctm_role=${encodeURIComponent(u.role)}${opts}`;
  } else {
    const clear = `; path=/; max-age=0; samesite=lax${secure}`;
    document.cookie = `ctm_user_id=${clear}`;
    document.cookie = `ctm_company_id=${clear}`;
    document.cookie = `ctm_role=${clear}`;
  }
}

// Persist a Partial<User> edit to ctm-service (PATCH /users/:id). Maps camelCase →
// the snake_case CTM contract. Client-side (token in memory), non-fatal.
function patchCtmProfile(id: string, updates: Partial<User>) {
  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.isActive !== undefined) body.is_active = updates.isActive;
  if (updates.isVerified !== undefined) body.is_verified = updates.isVerified;
  if (updates.consentAccepted !== undefined) body.consent_accepted = updates.consentAccepted;
  if (updates.consentAcceptedAt !== undefined) body.consent_accepted_at = updates.consentAcceptedAt;
  if (updates.onboardingCompleted !== undefined) body.onboarding_completed = updates.onboardingCompleted;
  if (updates.candidateOnboardingCompleted !== undefined) body.candidate_onboarding_completed = updates.candidateOnboardingCompleted;
  const p = updates.profile;
  if (p) {
    if (p.avatarUrl !== undefined) body.avatar_url = p.avatarUrl;
    if (p.bio !== undefined) body.bio = p.bio;
    if (p.location !== undefined) body.location = p.location;
    if (p.experienceLevel !== undefined) body.experience_level = p.experienceLevel;
    if (p.skills !== undefined) body.skills = p.skills;
    if (p.githubUrl !== undefined) body.github_url = p.githubUrl;
    if (p.linkedinUrl !== undefined) body.linkedin_url = p.linkedinUrl;
    if (p.portfolioLinks !== undefined) body.portfolio_links = p.portfolioLinks;
  }
  if (Object.keys(body).length) ctmClient.patch(`/users/${id}`, body).catch(() => { /* non-fatal */ });
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
      let cancelled = false;
      // Silent restore: refresh via the httpOnly cookie (no redirect), then load /users/me.
      bootstrapSession()
        .then(async (ok) => {
          if (cancelled || !ok) return;
          try {
            // Gateway BFF /me returns { user: { userId, email, ... }, csrfToken }.
            // ctmApiClient strips the `data` wrapper but not the `user` sub-key.
            const meResp = await ctmProxyClient.get<any>('/me');
            if (cancelled || !meResp) return;
            // Handle both direct ProxyUser shape and gateway { user: {...} } wrapper.
            const freshUser: ProxyUser = meResp?.user ?? meResp;
            if (!freshUser?.userId && !freshUser?.id) return;
            const ctmUser = mapProxyUserToCTM(freshUser);
            // Adopt app-role, companyId, onboarding/consent flags + profile from the ctm profile.
            applyProfile(ctmUser, await fetchCtmProfileFields(ctmUser.id));
            if (cancelled) return;
            setUser(ctmUser);
            setCtmScopeCookies(ctmUser);
            mirrorCtmProfile(ctmUser);
            if (ctmUser.role === 'company' && ctmUser.companyId) {
              fetchRealCompanyData(ctmUser.companyId);
            }
          } catch {
            /* no valid session */
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
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
      } else {
        // Persist profile edits / consent / onboarding flags to ctm-service (authed, non-fatal).
        patchCtmProfile(prevUser.id, updates);
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

  // Shared post-credential session bootstrap — used by password login AND passwordless OTP login.
  // Maps the gateway/auth-service response to the CTM user, adopts the ctm-service profile, and
  // sets the in-memory token + context user (the redirect guard then routes the user).
  const establishCtmSession = async (raw: any): Promise<void> => {
    // Old auth-service: { token, refreshToken, user }
    // Gateway BFF:      { user: { userId, email, fullName, roles, orgId }, csrfToken }
    const token = raw?.token ?? raw?.data?.accessToken;
    if (token) storeToken(token);
    const proxyUser: ProxyUser = raw?.user ?? raw;
    const ctmUser = mapProxyUserToCTM(proxyUser);
    // Adopt app-role, companyId, onboarding/consent flags + profile from the ctm profile
    // (identity only knows org role 'owner'). Onboarding flags MUST be applied to avoid
    // the redirect guard bouncing the user to the onboarding flow.
    applyProfile(ctmUser, await fetchCtmProfileFields(ctmUser.id));
    setUser(ctmUser);
    setCtmScopeCookies(ctmUser);
    mirrorCtmProfile(ctmUser); // name/email only — never clobbers the profile role
    if (ctmUser.role === 'company' && ctmUser.companyId) {
      await fetchRealCompanyData(ctmUser.companyId);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    if (!USE_MOCK) {
      try {
        const raw = await ctmAuthClient.post<any>('/login', credentials);
        await establishCtmSession(raw);
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

  // Passwordless email-OTP login: verify the code, then bootstrap the session exactly like
  // password login (the redirect guard routes the user once `user` is set).
  const loginWithOtp = async (email: string, code: string): Promise<AuthResult> => {
    if (USE_MOCK) return { success: false, message: "OTP login is unavailable in mock mode." };
    try {
      const raw = await ctmAuthClient.post<any>('/email/otp/verify', { email, code });
      await establishCtmSession(raw);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Verification failed" };
    }
  };

  const signup = async (details: SignupDetails): Promise<AuthResult> => {
    if (!USE_MOCK) {
      try {
        // Gateway register expects fullName/orgName; it issues the org role 'owner'.
        const reg = await ctmAuthClient.post<any>('/register', {
          email: details.email,
          password: details.password,
          fullName: details.name,
          orgName: details.companyName,
        });
        const newId = reg?.user?.id ? String(reg.user.id) : undefined;
        const newOrg = reg?.user?.orgId ?? undefined;
        // Auto-login after successful registration
        const loginResult = await login({ email: details.email, password: details.password });
        if (loginResult.success && newId) {
          if (details.role === 'company') {
            // Create the ctm company with id = orgId so the frontend's companyId (=orgId) resolves it.
            if (details.companyName && newOrg) {
              await ctmClient.post('/companies', {
                id: newOrg,
                name: details.companyName,
                description: details.companyDescription,
                website: details.companyWebsite,
              }).catch(() => {});
            }
            await ctmClient.post('/users', { id: newId, role: 'company', company_id: newOrg }).catch(() => {});
            updateUser({ role: 'company', companyId: newOrg });
          } else {
            // candidate / admin: stamp the chosen app-role on the new profile
            await ctmClient.post('/users', { id: newId, role: details.role }).catch(() => {});
            updateUser({ role: details.role });
          }
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
      setCtmScopeCookies(null);
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
      // Shared-auth SSO landing — must be public so the client guard doesn't bounce the
      // returning (cookie-less, cross-apex) user to /login before the callback runs.
      pathname.startsWith("/auth") ||
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
        loginWithOtp,
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
