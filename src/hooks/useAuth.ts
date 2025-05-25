// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check once on mount
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isAuthenticated: !!user };
}