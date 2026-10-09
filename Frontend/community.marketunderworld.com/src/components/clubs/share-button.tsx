"use client";
import { Share2 } from "lucide-react";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const handleShare = async () => {
    if (typeof navigator === "undefined") return;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* user cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };
  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-[#ed6c2a] transition-colors"
    >
      <Share2 className="w-4 h-4 text-[#ed6c2a]" /> Share
    </button>
  );
}
