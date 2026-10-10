"use client";

import { Share2, Navigation } from "lucide-react";
import { useState } from "react";

interface Props {
  clubName: string;
  address?: string;
  city: string;
  state: string;
}

export function ClubActionButtons({ clubName, address, city, state }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${clubName} — ${city}, ${state}`;
    const text = `Check out ${clubName} in ${city}! Book your guest list or VIP table.`;

    if (typeof navigator === "undefined") return;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* user cancelled */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDirections = () => {
    // Build Google Maps query: prefer full address, fall back to "ClubName, City, State"
    const query = address
      ? encodeURIComponent(`${clubName}, ${address}, ${city}, ${state}, India`)
      : encodeURIComponent(`${clubName}, ${city}, ${state}, India`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Share club"
        onClick={handleShare}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#ed6c2a] px-3 py-2 border border-gray-200 hover:border-[#ed6c2a]/40 rounded-xl transition-all"
      >
        <Share2 className="w-3.5 h-3.5" />
        {copied ? "Copied!" : "Share"}
      </button>
      <button
        aria-label="Get directions to club"
        onClick={handleDirections}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#ed6c2a] px-3 py-2 border border-gray-200 hover:border-[#ed6c2a]/40 rounded-xl transition-all"
      >
        <Navigation className="w-3.5 h-3.5 text-[#ed6c2a]" />
        Directions
      </button>
    </div>
  );
}
