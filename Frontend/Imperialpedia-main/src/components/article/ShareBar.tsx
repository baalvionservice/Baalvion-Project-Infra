"use client";

import { useState } from "react";

interface ShareBarProps {
  url: string;
  title: string;
}

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d={d} />
  </svg>
);

const ICONS = {
  x: "M18.9 2H22l-7.4 8.5L23.3 22H16.9l-5-6.6-5.7 6.6H2.9l7.9-9.1L2 2h6.6l4.5 6.1L18.9 2zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20z",
  facebook:
    "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z",
  linkedin:
    "M20.4 20.4h-3.5v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2 2 0 1 1 0-4.1 2 2 0 0 1 0 4.1zM7 20.4H3.6V9H7v11.4z",
  mail: "M2 4h20v16H2V4zm2 2.4V18h16V6.4l-8 5.6-8-5.6zm.6-.4L12 9.5 19.4 4H4.6z",
};

export function ShareBar({ url, title }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing more we can do here.
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-2">
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:border-[#CC0000] hover:text-[#CC0000] transition-colors"
      >
        {icon(ICONS.x)}
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:border-[#CC0000] hover:text-[#CC0000] transition-colors"
      >
        {icon(ICONS.facebook)}
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:border-[#CC0000] hover:text-[#CC0000] transition-colors"
      >
        {icon(ICONS.linkedin)}
      </a>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        aria-label="Share by email"
        className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:border-[#CC0000] hover:text-[#CC0000] transition-colors"
      >
        {icon(ICONS.mail)}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="text-xs font-bold text-muted-foreground border border-border rounded-full px-3 h-8 hover:border-[#CC0000] hover:text-[#CC0000] transition-colors"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
