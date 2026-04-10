"use client";

import React, { useMemo, useState } from "react";
import ImageCard from "./ImageCard";

type Caption = {
  id: string;
  content?: string | null;
  text?: string | null;
  caption_votes?: { vote_value: number }[];
};
type ImageRow = {
  id: string;
  url: string;
  captions?: Caption[];
};

type CaptionItem = { id: string; text: string };

export default function GalleryGrid({ images }: { images: ImageRow[] }) {
  const normalized = useMemo(() => {
    return (images ?? [])
      .map((img) => {
        const caps = Array.isArray(img.captions) ? img.captions : [];
        const cleaned: CaptionItem[] = caps
          .map((c) => {
            const text = (c.content ?? (c as any).text ?? "").toString().trim();
            return { id: c.id, text };
          })
          .filter((c) => c.text.length > 0);

        return { id: img.id, url: img.url, captions: cleaned };
      })
      .filter((img) => img.url && img.captions.length > 0);
  }, [images]);

  const [idxByImage, setIdxByImage] = useState<Record<string, number>>({});
  const [sort, setSort] = useState<"newest" | "hot">("newest");

  const sorted = useMemo(() => {
    if (sort === "newest") return normalized;
    return [...normalized].sort((a, b) => {
      const scoreOf = (img: typeof a) =>
        img.captions.reduce((sum, c) => {
          const votes = (c as any).caption_votes as { vote_value: number }[] | undefined;
          return sum + (votes ?? []).reduce((s, v) => s + v.vote_value, 0);
        }, 0);
      return scoreOf(b) - scoreOf(a);
    });
  }, [normalized, sort]);

  const advanceStack = (imageId: string) => {
    setIdxByImage((prev) => {
      const current = prev[imageId] ?? 0;
      return { ...prev, [imageId]: current + 1 };
    });
  };

  const visibleTiles = useMemo(() => {
    return sorted
      .map((img) => {
        const idx = idxByImage[img.id] ?? 0;
        const caption = img.captions[idx];
        if (!caption) return null;
        return { imageId: img.id, url: img.url, caption, idx, total: img.captions.length };
      })
      .filter(Boolean) as Array<{
      imageId: string;
      url: string;
      caption: CaptionItem;
      idx: number;
      total: number;
    }>;
  }, [sorted, idxByImage]);

  return visibleTiles.length > 0 ? (
    <>
      {/* Sort toggle */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mr-1">Sort:</span>
        <button
          onClick={() => setSort("newest")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            sort === "newest"
              ? "bg-indigo-500 text-white shadow"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
          }`}
        >
          Newest
        </button>
        <button
          onClick={() => setSort("hot")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            sort === "hot"
              ? "bg-orange-500 text-white shadow"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
          }`}
        >
          🔥 Hot
        </button>
      </div>
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {visibleTiles.map((tile) => (
        <ImageCard
          key={`${tile.imageId}:${tile.caption.id}`}
          item={{ imageId: tile.imageId, url: tile.url, caption: tile.caption }}
          onVoted={() => advanceStack(tile.imageId)}
          progress={{ current: tile.idx + 1, total: tile.total }}
        />
      ))}
      </div>
    </>
  ) : (
    <p className="text-center text-slate-500 dark:text-slate-400">No public images available.</p>
  );
}
