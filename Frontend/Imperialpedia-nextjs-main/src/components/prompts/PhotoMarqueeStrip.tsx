'use client';

import { useEffect, useState } from 'react';

const STEP_MS = 2200;
const TRANSITION_MS = 900;

/** Steps exactly one photo left every ~2s, then snaps back to the start once the duplicated
 * tail lines up with the original head. Position is driven by percentage of the doubled track
 * (not a measured pixel width), so the loop point is exact — no drift, no visible jump. */
export function PhotoMarqueeStrip({ photos }: { photos: string[] }) {
  const [index, setIndex] = useState(0);
  const [transitionOn, setTransitionOn] = useState(true);
  const n = photos.length;
  const doubled = [...photos, ...photos];

  useEffect(() => {
    if (n === 0) return;
    const id = setInterval(() => setIndex((i) => i + 1), STEP_MS);
    return () => clearInterval(id);
  }, [n]);

  // Once we've scrolled a full set into the duplicate copy, snap back to 0 without a
  // transition — the duplicate is pixel-identical to the original, so the jump is invisible.
  useEffect(() => {
    if (index !== n) return;
    const t = setTimeout(() => {
      setTransitionOn(false);
      setIndex(0);
    }, TRANSITION_MS);
    return () => clearTimeout(t);
  }, [index, n]);

  useEffect(() => {
    if (transitionOn) return;
    const raf = requestAnimationFrame(() => setTransitionOn(true));
    return () => cancelAnimationFrame(raf);
  }, [transitionOn]);

  if (n === 0) return null;

  // The doubled track is 2x one full set wide, so -50% is exactly one set's width — expressing
  // the offset as a fraction of that keeps every step exact without measuring any pixel width.
  const offsetPercent = (index / n) * 50;

  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <div
        className={`flex gap-4 ${transitionOn ? 'transition-transform ease-in-out' : ''}`}
        style={{ transform: `translateX(-${offsetPercent}%)`, transitionDuration: `${TRANSITION_MS}ms` }}
      >
        {doubled.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            aria-hidden="true"
            className="h-72 sm:h-96 w-56 sm:w-72 flex-shrink-0 rounded-xl object-cover ring-1 ring-primary/40"
            loading={i < 4 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
    </div>
  );
}
