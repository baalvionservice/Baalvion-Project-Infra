'use client';

import { useEffect, useState } from 'react';
import { ArticleShareBar } from './ArticleShareBar';

/** Floating share pill that appears once the reader scrolls past the header's
 *  own share row, so sharing stays reachable mid-article. */
export function StickyShareBar({ url, title }: { url: string; title: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setVisible(window.scrollY > 640));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[9997] -translate-x-1/2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur transition-all duration-200 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArticleShareBar url={url} title={title} />
    </div>
  );
}
