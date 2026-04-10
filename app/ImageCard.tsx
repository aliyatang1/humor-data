"use client";

import React, { useEffect, useState } from "react";
import { submitVote } from "./actions/votes";

function ShareButton({ url, caption }: { url: string; caption: string }) {
  const [label, setLabel] = useState("Share");

  const handleShare = async () => {
    const shareData = {
      title: "Humor Feed",
      text: caption,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${caption}\n${url}`);
        setLabel("Copied!");
        setTimeout(() => setLabel("Share"), 2000);
      }
    } catch {
      // user cancelled share — do nothing
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full rounded-lg py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
    >
      🔗 {label}
    </button>
  );
}

type CaptionItem = { id: string; text: string };

type CardItem = {
  imageId: string;
  url: string;
  caption: CaptionItem;
};

export default function ImageCard({
  item,
  onVoted,
  progress,
}: {
  item: CardItem;
  onVoted: () => void;
  progress?: { current: number; total: number };
}) {
  const [status, setStatus] = useState<null | "idle" | "loaded" | "error">(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);

  useEffect(() => {
    setStatus((s) => (s === null ? "idle" : s));
  }, []);

  useEffect(() => {
    if (!item?.url) return;
    if (status !== "idle") return;

    const timeoutMs = 3500;
    const img = new Image();
    let handled = false;

    const timer = setTimeout(() => {
      try {
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (handled) return;
          handled = true;
          setStatus("loaded");
        };
        img.onerror = () => {
          if (handled) return;
          handled = true;
          setStatus("error");
        };
        const sep = item.url.includes("?") ? "&" : "?";
        img.src = `${item.url}${sep}cachebust=${Date.now()}`;
      } catch {
        setStatus("error");
      }
    }, timeoutMs);

    return () => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
    };
  }, [item.url, status]);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    setIsVoting(true);
    setVoteMessage(null);

    try {
      const result = await submitVote(item.caption.id, voteType);

      if (result.success) {
        setUserVote(voteType);
        setVoteMessage(voteType === "upvote" ? "✓ Upvoted" : "✓ Downvoted");
        onVoted();
      } else {
        setVoteMessage(result.error || "Failed to submit vote");
      }
    } catch (err) {
      console.error("[ImageCard] vote error", err);
      setVoteMessage("Failed to submit vote");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      {/* Color accent strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
      {/* Image */}
      <div className="relative bg-slate-100 dark:bg-slate-700">
        <div className="aspect-[4/5] w-full overflow-hidden">
          <img
            src={item.url}
            alt={item.caption.text || "Gallery image"}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
        </div>

        {status !== null && status !== "loaded" && (
          <div className="absolute left-4 top-4 rounded-full bg-white/90 dark:bg-slate-800/90 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur">
            {status === "idle" ? "Loading…" : "Image failed"}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Caption */}
      <div className="p-5">
        <p className="text-[15px] font-medium leading-snug text-slate-900 dark:text-slate-100">{item.caption.text}</p>

        {/* Voting */}
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleVote("upvote")}
              disabled={isVoting}
              aria-label="Upvote"
              className={`rounded-xl w-14 h-10 text-xl transition ${
                userVote === "upvote"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              👍
            </button>
            <button
              onClick={() => handleVote("downvote")}
              disabled={isVoting}
              aria-label="Downvote"
              className={`rounded-xl w-14 h-10 text-xl transition ${
                userVote === "downvote"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              👎
            </button>
          </div>

          {voteMessage && (
            <p
              className={`text-xs font-medium ${
                voteMessage.startsWith("✓") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {voteMessage}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold uppercase tracking-wide" title="Swipe through AI-generated captions for this meme">Caption Stack</span>

          {progress ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 font-mono text-xs">
                {progress.current}/{progress.total}
              </span>
            </div>
          ) : (
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-1 font-mono">{item.imageId.slice(0, 8)}</span>
          )}
        </div>

        {/* Share */}
        <div className="mt-3">
          <ShareButton url={item.url} caption={item.caption.text} />
        </div>
      </div>
    </article>
  );
}
