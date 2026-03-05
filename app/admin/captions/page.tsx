"use client";

import { useState, useEffect } from "react";
import { getCaptions } from "@/app/actions/admin";

interface CaptionData {
  id: string;
  content: string;
  image_id: string;
  created_at: string;
  votes: {
    upvotes: number;
    downvotes: number;
  };
}

export default function CaptionsPage() {
  const [captions, setCaptions] = useState<CaptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterImageId, setFilterImageId] = useState("");

  useEffect(() => {
    loadCaptions();
  }, []);

  async function loadCaptions() {
    try {
      setLoading(true);
      const data = await getCaptions();
      setCaptions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load captions");
    } finally {
      setLoading(false);
    }
  }

  const filteredCaptions = captions.filter((caption) => {
    const matchesSearch = caption.content
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesImage =
      !filterImageId || caption.image_id === filterImageId;
    return matchesSearch && matchesImage;
  });

  // Get unique image IDs for filter dropdown
  const uniqueImageIds = Array.from(new Set(captions.map((c) => c.image_id)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Captions Management</h1>
        <p className="text-gray-600 mt-2">View all generated captions (read-only)</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search captions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm"
        />
        <select
          value={filterImageId}
          onChange={(e) => setFilterImageId(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
        >
          <option value="">All Images</option>
          {uniqueImageIds.map((id) => (
            <option key={id} value={id}>
              {id.slice(0, 8)}...
            </option>
          ))}
        </select>
        <div className="text-sm text-gray-600 whitespace-nowrap">
          {filteredCaptions.length} of {captions.length} captions
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Caption
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Image ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Votes
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCaptions.map((caption) => (
                <tr key={caption.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-2xl">
                    <p className="line-clamp-2">{caption.content}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {caption.image_id.slice(0, 12)}...
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <span className="text-green-600">👍</span>
                        <span className="font-medium">{caption.votes.upvotes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-red-600">👎</span>
                        <span className="font-medium">{caption.votes.downvotes}</span>
                      </div>
                      <div className="text-gray-500">
                        ({caption.votes.upvotes + caption.votes.downvotes})
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(caption.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredCaptions.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {search || filterImageId ? "No captions match your filters" : "No captions found"}
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm">
        <p className="font-medium mb-2">📋 Captions</p>
        <p>
          All captions displayed here are <strong>AI-generated</strong> by the platform. This view is{" "}
          <strong>read-only</strong> for safety. The vote counts show user engagement with each caption (upvotes
          and downvotes).
        </p>
      </div>
    </div>
  );
}
