'use client';

import { useEffect, useState } from 'react';

/** Cycles through `words` with a blinking cursor — the "Find [Latest] Easily" hero effect. */
export function RotatingWord({ words, intervalMs = 2000 }: { words: string[]; intervalMs?: number }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((prev) => (prev + 1) % words.length), intervalMs);
    return () => clearInterval(id);
  }, [words.length, intervalMs]);

  return (
    <span className="inline-flex items-center text-primary">
      {words[i]}
      <span className="ml-1 inline-block h-[1em] w-[2px] animate-pulse bg-primary" aria-hidden="true" />
    </span>
  );
}
