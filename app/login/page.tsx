"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [err, setErr] = useState<string | null>(null);

  async function signInWithGoogle() {
    setErr(null);
    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) setErr(error.message);
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Sign in
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Sign in to view the Humor Feed.
        </p>

        <button
          onClick={signInWithGoogle}
          className="mt-6 w-full rounded-2xl bg-slate-900 dark:bg-slate-700 px-4 py-3 font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-600"
        >
          Continue with Google
        </button>

        {err && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            {err}
          </p>
        )}
      </div>
    </main>
  );
}
