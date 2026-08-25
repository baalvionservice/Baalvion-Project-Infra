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

const BRAND = {
  x: "#000000",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  reddit: "#FF4500",
  mail: "#475569",
};

const iconLinkClass =
  "w-8 h-8 flex items-center justify-center rounded-full text-white transition-transform hover:scale-110";

const ICONS = {
  x: "M18.9 2H22l-7.4 8.5L23.3 22H16.9l-5-6.6-5.7 6.6H2.9l7.9-9.1L2 2h6.6l4.5 6.1L18.9 2zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20z",
  facebook:
    "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z",
  linkedin:
    "M20.4 20.4h-3.5v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2 2 0 1 1 0-4.1 2 2 0 0 1 0 4.1zM7 20.4H3.6V9H7v11.4z",
  mail: "M2 4h20v16H2V4zm2 2.4V18h16V6.4l-8 5.6-8-5.6zm.6-.4L12 9.5 19.4 4H4.6z",
  reddit:
    "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z",
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
        className={iconLinkClass}
        style={{ backgroundColor: BRAND.x }}
      >
        {icon(ICONS.x)}
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className={iconLinkClass}
        style={{ backgroundColor: BRAND.facebook }}
      >
        {icon(ICONS.facebook)}
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className={iconLinkClass}
        style={{ backgroundColor: BRAND.linkedin }}
      >
        {icon(ICONS.linkedin)}
      </a>
      <a
        href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Reddit"
        className={iconLinkClass}
        style={{ backgroundColor: BRAND.reddit }}
      >
        {icon(ICONS.reddit)}
      </a>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        aria-label="Share by email"
        className={iconLinkClass}
        style={{ backgroundColor: BRAND.mail }}
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
