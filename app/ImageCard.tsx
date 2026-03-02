"use client";

import React, { useEffect, useState } from "react";
import { submitVote } from "./actions/votes";

type Caption = { id: string; content?: string; text?: string };

type ImageCardRow = {
  // A unique id for the card (use caption id so each caption becomes its own card)
  cardId: string;

  // Original image info
  imageId: string;
  url: string;

  // Single caption for this card
  caption: Caption;
};

export default function ImageCard({ image }: { image: ImageCardRow }) {
  const [status, setStatus] = useState<null | "idle" | "loaded" | "error">(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);

  useEffect(() => {
    setStatus((s) => (s === null ? "idle" : s));
  }, []);

  // programmatic retry if stuck loading
  useEffect(() => {
    if (!image?.url) return;
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
          console.debug("[ImageCard] programmatic onload", image.imageId, image.url);
          setStatus("loaded");
        };
        img.onerror = (e) => {
          if (handled) return;
          handled = true;
          console.error("[ImageCard] programmatic onerror", image.imageId, image.url, e);
          setStatus("error");
        };
        const sep = image.url.includes("?") ? "&" : "?";
        img.src = `${image.url}${sep}cachebust=${Date.now()}`;
      } catch (err) {
        console.error("[ImageCard] programmatic load failed", image.imageId, image.url, err);
        setStatus("error");
      }
    }, timeoutMs);

    return () => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
    };
  }, [image.url, image.imageId, status]);

  // Normalize caption text + ignore empties
  const captionText = (image.caption?.content ?? (image.caption as any)?.text ?? "")
    .toString()
    .trim();

  // If caption is empty, you can either:
  // A) render nothing (return null), or
  // B) show "No caption yet"
  // You asked to NOT call empty captions, so we do A:
  if (!captionText) return null;

  const captionId = image.caption.id;
  const altText = captionText || "Gallery image";

  const handleVote = async (voteType: "upvote" | "downvote") => {
    setIsVoting(true);
    setVoteMessage(null);

    try {
      const result = await submitVote(captionId, voteType);

      if (result.success) {
        setUserVote(voteType);
        setVoteMessage(voteType === "upvote" ? "✓ Upvoted!" : "✓ Downvoted!");
        setTimeout(() => setVoteMessage(null), 2000);
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
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      {/* Image */}
      <div className="relative bg-slate-100">
        <div className="aspect-[4/5] w-full overflow-hidden">
          <img
            src={image.url}
            alt={altText}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            onLoad={() => {
              console.debug("[ImageCard] onLoad", image.imageId, image.url);
              setStatus("loaded");
            }}
            onError={(e) => {
              console.error("[ImageCard] onError", image.imageId, image.url, e);
              setStatus("error");
            }}
          />
        </div>

        {/* Loading / Error badges */}
        {status !== null && status !== "loaded" && (
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
            {status === "idle" ? "Loading…" : "Image failed"}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Caption + Vote */}
      <div className="p-5">
        <p className="text-[15px] font-medium leading-snug text-slate-900">{captionText}</p>

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleVote("upvote")}
              disabled={isVoting}
              className={`flex-1 rounded-lg py-2 font-semibold text-sm transition ${
                userVote === "upvote"
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              👍 Upvote
            </button>
            <button
              onClick={() => handleVote("downvote")}
              disabled={isVoting}
              className={`flex-1 rounded-lg py-2 font-semibold text-sm transition ${
                userVote === "downvote"
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              👎 Downvote
            </button>
          </div>

          {voteMessage && (
            <p
              className={`text-xs font-medium ${
                voteMessage.startsWith("✓") ? "text-green-600" : "text-red-600"
              }`}
            >
              {voteMessage}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold uppercase tracking-wide">Community</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 font-mono">
            {image.imageId.slice(0, 8)}
          </span>
        </div>
      </div>
    </article>
  );
}
