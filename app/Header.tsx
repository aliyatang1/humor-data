"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTheme } from "./providers/ThemeProvider";

export default function Header() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<any | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    let mounted = true;

    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_superadmin")
          .eq("id", data.user.id)
          .single();

        if (mounted && profile?.is_superadmin) {
          setIsSuperadmin(true);
        }
      }
    }

    fetchUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("is_superadmin")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (mounted && profile?.is_superadmin) {
              setIsSuperadmin(true);
            } else {
              setIsSuperadmin(false);
            }
          });
      } else {
        setIsSuperadmin(false);
      }
    });

    return () => {
      mounted = false;
      try {
        sub.subscription.unsubscribe();
      } catch (e) {}
    };
  }, [supabase]);

  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div>
          <Link href="/" className="text-xl font-bold text-slate-900 dark:text-white">
            HUMOR FEED
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {mounted && (
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
              className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="light">☀️</option>
              <option value="dark">🌙</option>
              <option value="system">💻</option>
            </select>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {user.user_metadata?.full_name || user.email}
              </span>
              {isSuperadmin && (
                <Link href="/admin" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                  Admin
                </Link>
              )}
              <Link href="/logout" className="rounded-lg bg-slate-900 dark:bg-slate-700 px-3 py-1 text-white text-sm hover:bg-slate-800 dark:hover:bg-slate-600">
                Sign out
              </Link>
            </div>
          ) : (
            <Link href="/login" className="rounded-lg bg-slate-900 dark:bg-slate-700 px-3 py-1 text-white text-sm hover:bg-slate-800 dark:hover:bg-slate-600">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
