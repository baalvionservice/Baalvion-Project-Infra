"use client";

import { useEffect, useState } from "react";
import { Plus, Check } from "lucide-react";
import { isFollowingTopic, toggleFollowTopic } from "@/lib/followed-topics";
import { getTopicColor } from "@/lib/topic-colors";

export function FollowTopicButton({ categorySlug, categoryName }: { categorySlug: string; categoryName: string }) {
  const [following, setFollowing] = useState(false);
  const color = getTopicColor(categoryName);

  useEffect(() => {
    setFollowing(isFollowingTopic(categorySlug));
  }, [categorySlug]);

  return (
    <button
      type="button"
      onClick={() => setFollowing(toggleFollowTopic(categorySlug))}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors"
      style={
        following
          ? { backgroundColor: color, borderColor: color, color: "#fff" }
          : { borderColor: color, color }
      }
    >
      {following ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
      {following ? "Following" : `Follow ${categoryName}`}
    </button>
  );
}
