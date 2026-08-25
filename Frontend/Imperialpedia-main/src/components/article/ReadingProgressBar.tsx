"use client";

import { useEffect, useState } from "react";
import { getTopicColor } from "@/lib/topic-colors";

export function ReadingProgressBar({ categoryName }: { categoryName?: string }) {
  const [progress, setProgress] = useState(0);
  const color = getTopicColor(categoryName);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const scrollable = doc.scrollHeight - doc.clientHeight;
        setProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-16 z-40 h-1 bg-transparent lg:top-[108px]" aria-hidden="true">
      <div className="h-full transition-[width] duration-100" style={{ width: `${progress}%`, backgroundColor: color }} />
    </div>
  );
}
