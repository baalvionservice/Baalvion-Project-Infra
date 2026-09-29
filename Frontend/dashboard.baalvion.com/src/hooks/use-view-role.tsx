"use client";
// Reactive role context. Separates the user's ACTUAL (JWT-derived) role from the VIEW role used to
// render the dashboard. Only an ADMIN may preview other roles ("view as"); everyone else is pinned to
// their real role. The view choice is persisted (localStorage) and reactive — changing it re-renders
// the dashboard instantly (the old code read the role once on mount, so switching did nothing).
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getUserRole } from "@/lib/auth";
import type { Role } from "@/lib/types";

const STORAGE_KEY = "baalvion_view_role";
const ROLES: Role[] = ["ADMIN", "INVESTOR", "CO_FOUNDER", "EMPLOYEE"];

interface ViewRoleContextValue {
  role: Role;        // effective role driving the UI
  actualRole: Role;  // the user's real (JWT-derived) role
  canSwitch: boolean; // only admins may preview other roles
  setViewRole: (r: Role) => void;
  resetRole: () => void;
}

const ViewRoleContext = createContext<ViewRoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [actualRole, setActualRole] = useState<Role>("ADMIN");
  const [override, setOverride] = useState<Role | null>(null);

  const deriveActual = useCallback(() => {
    const r = getUserRole();
    if (r) setActualRole(r);
  }, []);

  useEffect(() => {
    deriveActual();
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Role | null;
      if (saved && ROLES.includes(saved)) setOverride(saved);
    } catch { /* ignore */ }
    // Re-derive once the cookie session/bootstrap resolves (api-client dispatches 'auth-changed').
    const onAuth = () => deriveActual();
    window.addEventListener("auth-changed", onAuth);
    return () => window.removeEventListener("auth-changed", onAuth);
  }, [deriveActual]);

  const canSwitch = actualRole === "ADMIN";
  const role: Role = canSwitch && override ? override : actualRole;

  const setViewRole = useCallback((r: Role) => {
    setOverride(r);
    try { localStorage.setItem(STORAGE_KEY, r); } catch { /* ignore */ }
  }, []);

  const resetRole = useCallback(() => {
    setOverride(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <ViewRoleContext.Provider value={{ role, actualRole, canSwitch, setViewRole, resetRole }}>
      {children}
    </ViewRoleContext.Provider>
  );
}

export function useViewRole(): ViewRoleContextValue {
  const ctx = useContext(ViewRoleContext);
  if (!ctx) {
    return { role: "ADMIN", actualRole: "ADMIN", canSwitch: false, setViewRole: () => {}, resetRole: () => {} };
  }
  return ctx;
}
