import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const isUserVerified = (user: User | null): boolean => {
  if (!user) return false;
  if (user.email_confirmed_at) return true;
  if ((user as any).confirmed_at) return true;
  const provider = user.app_metadata?.provider;
  if (provider && provider !== "email") return true;
  return false;
};

export const useVerified = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, verified: isUserVerified(user), loading };
};
