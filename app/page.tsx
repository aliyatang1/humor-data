import Link from "next/link";
import GalleryGrid from "./GalleryGrid";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  }
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GalleryPage() {
  const { data: images, error } = await supabase
    .from("images")
    .select(
      `
      id,
      url,
      captions (
        id,
        content,
        caption_votes (
          vote_value
        )
      )
    `
    )
    .eq("is_public", true)
    .order("created_datetime_utc", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <pre className="text-red-500 dark:text-red-400">{error.message}</pre>
      </main>
    );
  }

  const imagesSafe = images ?? [];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            HUMOR FEED
          </h1>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
            The internet's quiet thoughts, out loud.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-[3px] w-20 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
          </div>
        </header>

        {/* Upload CTA */}
        <div className="mb-10 flex items-center justify-between rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/30 px-6 py-4">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">Got a meme?</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Browse and vote below, or upload your own.</p>
          </div>
          <Link
            href="/upload"
            className="ml-4 shrink-0 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-bold text-white shadow hover:opacity-90 transition"
          >
            Upload a Meme →
          </Link>
        </div>

        <GalleryGrid images={imagesSafe as any} />
      </div>
    </main>
  );
}
