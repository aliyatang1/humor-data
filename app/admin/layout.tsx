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

      // Get current user
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/login");
        return;
      }

      // Check if user has is_superadmin flag
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
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isSuperadmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/admin" className="font-bold text-lg">
              Admin Dashboard
            </Link>
            <div className="flex space-x-4 text-sm">
              <Link
                href="/admin"
                className="text-gray-700 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="text-gray-700 hover:text-gray-900"
              >
                Users
              </Link>
              <Link
                href="/admin/images"
                className="text-gray-700 hover:text-gray-900"
              >
                Images
              </Link>
              <Link
                href="/admin/captions"
                className="text-gray-700 hover:text-gray-900"
              >
                Captions
              </Link>
            </div>
          </div>
          <Link href="/logout" className="text-sm text-gray-700 hover:text-gray-900">
            Logout
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
