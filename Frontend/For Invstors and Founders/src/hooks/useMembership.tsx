import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Membership {
  id: string;
  plan: string;
  status: string;
  amount_usd: number | null;
  started_at: string | null;
  expires_at: string | null;
}

// Reads the current user's membership. Admins bypass the gate (treated active).
export const useMembership = () => {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setMembership(null); setLoading(false); return; }
    const { data } = await supabase.from("memberships" as any).select("*").eq("user_id", user.id).maybeSingle();
    setMembership((data as Membership) || null);
    setLoading(false);
  }, [user]);

  useEffect(() => { setLoading(true); refresh(); }, [refresh]);

  return { membership, active: isAdmin || membership?.status === "active", isAdmin, loading, refresh };
};
