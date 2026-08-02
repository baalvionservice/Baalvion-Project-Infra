"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Scroll-spy table of contents. The heading list itself is computed
 * server-side (from the same markup that's already rendered in the DOM) so
 * this component only needs the client for the IntersectionObserver
 * highlight — it never re-fetches or re-renders the article body.
 */
export function ArticleTOC({ items }: { items: TOCItem[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveId(entry.target.id);
      });
    };

    observer.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-100px 0px -70% 0px',
      threshold: 0,
    });

    const timer = setTimeout(() => {
      items.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer.current?.observe(el);
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      observer.current?.disconnect();
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-6">
      <h4 className="text-[18px] font-bold text-slate-900 tracking-tight">Table of Contents</h4>
      <div className="relative border-l border-slate-100">
        <nav className="flex flex-col">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "text-[14px] leading-tight py-2.5 transition-all duration-300 relative pl-6 block",
                activeId === item.id
                  ? "text-blue-600 font-bold"
                  : "text-slate-500 hover:text-slate-900 font-medium"
              )}
              style={{ paddingLeft: `${(item.level - 2) * 12 + 24}px` }}
            >
              {activeId === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-blue-600 border-b-[5px] border-b-transparent" />
                </div>
              )}
              {item.text}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
