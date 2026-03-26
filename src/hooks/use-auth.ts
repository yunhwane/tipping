"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "~/lib/supabase/client";
import { api } from "~/trpc/react";

interface AuthUser {
  id: string;
  email: string;
  nickname?: string | null;
  image?: string | null;
  role?: string;
}

interface AuthSession {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

export function useAuth(): AuthSession {
  const [supabaseUserId, setSupabaseUserId] = useState<string | null | undefined>(undefined);
  const [supabaseEmail, setSupabaseEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUserId(session?.user?.id ?? null);
      setSupabaseEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!supabaseUserId;
  const { data: profile } = api.user.getProfile.useQuery(
    undefined,
    { enabled: isAuthenticated },
  );

  return useMemo(() => {
    if (supabaseUserId === undefined) return { user: null, status: "loading" as const };
    if (!supabaseUserId) return { user: null, status: "unauthenticated" as const };
    if (profile) {
      return {
        user: { id: supabaseUserId, email: supabaseEmail ?? profile.email, nickname: profile.nickname, image: profile.image, role: profile.role },
        status: "authenticated" as const,
      };
    }
    return {
      user: { id: supabaseUserId, email: supabaseEmail ?? "" },
      status: "authenticated" as const,
    };
  }, [supabaseUserId, supabaseEmail, profile]);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/";
}
