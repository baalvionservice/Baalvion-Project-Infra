import { useEffect, useState } from "react";
import { supabase, type AuthUser as User } from "@/integrations/supabase/client";

export const isUserVerified = (user: User | null): boolean => !!user?.email_verified;

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
    return () => { subscription.unsubscribe(); };
  }, []);

  return { user, verified: isUserVerified(user), loading };
};
