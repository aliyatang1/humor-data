"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSuperadmin, setIsSuperadmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperadmin = async () => {
      const supabase = createSupabaseBrowserClient();

      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_superadmin")
        .eq("id", authData.user.id)
        .single();

      if (error || !profile?.is_superadmin) {
        router.push("/");
        return;
      }

      setIsSuperadmin(true);
      setLoading(false);
    };

    checkSuperadmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!isSuperadmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/admin" className="font-bold text-lg text-gray-900 dark:text-white">
              Admin Dashboard
            </Link>
            <div className="flex space-x-4 text-sm">
              <Link href="/admin" className="text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
                Users
              </Link>
              <Link href="/admin/images" className="text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
                Images
              </Link>
              <Link href="/admin/captions" className="text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
                Captions
              </Link>
              <Link href="/admin/humor-flavors" className="text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
                Humor Flavors
              </Link>
              <Link href="/admin/llm-prompt-chains" className="text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
                LLM Prompt Chains
              </Link>
            </div>
          </div>
          <Link href="/logout" className="text-sm text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white">
            Logout
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
