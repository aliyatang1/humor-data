import UploadSection from "../UploadSection";
import Link from "next/link";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Upload a Meme
          </h1>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
            Upload your image and AI will generate captions for it.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-[3px] w-20 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
          </div>
        </header>

        <UploadSection />

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition"
          >
            ← Back to gallery
          </Link>
        </div>
      </div>
    </main>
  );
}
