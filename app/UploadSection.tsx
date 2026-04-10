"use client";

import { useState, useMemo, useEffect } from "react";
import { uploadImageAndGenerateCaptions, generateMoreCaptions } from "./actions/captions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function UploadSection() {
  const [isUploadingOrGenerating, setIsUploadingOrGenerating] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);
    }

    fetchUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      try {
        sub.subscription.unsubscribe();
      } catch (e) {}
    };
  }, [supabase]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
    ];
    if (!supportedTypes.includes(file.type)) {
      setStatusMessage("Unsupported image type. Please use JPEG, PNG, WebP, GIF, or HEIC.");
      setUploadStatus("error");
      setTimeout(() => {
        setUploadStatus("idle");
        setStatusMessage(null);
      }, 3000);
      return;
    }

    setUploadStatus("uploading");
    setStatusMessage("Uploading image...");
    setGeneratedCaptions([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64String = btoa(binary);

      setUploadStatus("processing");
      setStatusMessage("Generating captions...");
      const result = await uploadImageAndGenerateCaptions(base64String, file.type);

      if (result.success) {
        setUploadStatus("success");
        setStatusMessage(`Successfully generated ${result.captions?.length || 0} captions!`);
        if (result.imageId) setUploadedImageId(result.imageId);
        const captions = (result.captions || []).map((caption: any) => {
          if (typeof caption === "string") return caption;
          if (caption.content) return caption.content;
          if (caption.text) return caption.text;
          return JSON.stringify(caption);
        });
        setGeneratedCaptions(captions);
        setTimeout(() => {
          setUploadStatus("idle");
          setStatusMessage(null);
        }, 3000);
      } else {
        setUploadStatus("error");
        setStatusMessage(result.error || "Failed to generate captions");
        setTimeout(() => {
          setUploadStatus("idle");
          setStatusMessage(null);
        }, 3000);
      }
    } catch (error) {
      setUploadStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "An error occurred");
      setTimeout(() => {
        setUploadStatus("idle");
        setStatusMessage(null);
      }, 3000);
    }
  };

  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-8 mb-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Upload & Generate Captions</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">You must be signed in to upload images.</p>
        <div className="flex gap-3">
          <a href="/login" className="rounded-2xl bg-slate-900 dark:bg-slate-700 px-4 py-2 text-white hover:bg-slate-800 dark:hover:bg-slate-600">
            Sign in
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-8 mb-12">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Upload & Generate Captions
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Upload an image and our AI will generate captions for it.
      </p>

      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20 p-6 cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition disabled:opacity-50">
          <span className="text-indigo-500 dark:text-indigo-400 text-3xl mb-2">🖼️</span>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Click to choose an image</span>
          <span className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP, GIF, HEIC</span>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
            onChange={handleFileSelect}
            disabled={isUploadingOrGenerating}
            className="hidden"
        </label>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm font-medium ${
            uploadStatus === "error"
              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
              : uploadStatus === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
          }`}
        >
          {statusMessage}
        </div>
      )}

      {generatedCaptions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Generated Captions:
          </h3>
          <div className="space-y-3">
            {generatedCaptions.map((caption, idx) => (
              <div
                key={idx}
                className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-lg"
              >
                <p className="text-slate-700 dark:text-slate-300">{caption}</p>
              </div>
            ))}
          </div>
          {uploadedImageId && (
            <button
              onClick={async () => {
                setIsGeneratingMore(true);
                const result = await generateMoreCaptions(uploadedImageId);
                if (result.success) {
                  const more = (result.captions || []).map((c: any) => {
                    if (typeof c === "string") return c;
                    if (c.content) return c.content;
                    if (c.text) return c.text;
                    return JSON.stringify(c);
                  });
                  setGeneratedCaptions((prev) => [...prev, ...more]);
                }
                setIsGeneratingMore(false);
              }}
              disabled={isGeneratingMore}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-2.5 text-sm font-bold text-white shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingMore ? "Generating…" : "✨ Generate More Captions"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
