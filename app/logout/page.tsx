"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LogoutPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function doSignOut() {
      try {
        const { error } = await supabase.auth.signOut();
        if (!mounted) return;
        if (error) {
          setError(error.message);
          return;
        }
        window.location.assign("/login");
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    doSignOut();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Signing out...</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400">If you are not redirected, click the link below.</p>
        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        <div className="mt-6">
          <Link href="/login" className="text-slate-900 dark:text-slate-300 underline hover:text-slate-700 dark:hover:text-white">
            Go to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
