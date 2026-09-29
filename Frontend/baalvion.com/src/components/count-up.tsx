'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  className?: string;
  durationMs?: number;
}

/**
 * Count-up that fires once when scrolled into view. Reserves final width to
 * stay CLS-safe, uses tabular figures, and honours reduced-motion (renders the
 * final value immediately).
 */
export function CountUp({ value, className = '', durationMs = 1100 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Start at the real value so server/no-JS renders the true figure (no "0");
  // the in-view rAF tick overwrites this from its first frame to animate up.
  const [display, setDisplay] = useState(value);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(value);
      setDone(true);
      return;
    }

    let raf = 0;
    let start = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();
          const tick = (t: number) => {
            if (!start) start = t;
            const p = Math.min((t - start) / durationMs, 1);
            // ease-out-expo
            const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
            setDisplay(Math.round(eased * value));
            if (p < 1) {
              raf = requestAnimationFrame(tick);
            } else {
              setDone(true);
            }
          };
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [value, durationMs]);

  return (
    <span
      ref={ref}
      className={`tabular-nums ${className}`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {done ? value : display}
    </span>
  );
}
