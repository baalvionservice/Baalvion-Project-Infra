'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_ITEMS } from '@/lib/nav';

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery('');
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_ITEMS.slice(0, 8);
    return ALL_ITEMS.filter(
      (item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
    ).slice(0, 20);
  }, [query]);

  if (!open) return null;

  function goTo(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ground/60 px-4 pt-24 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4 shrink-0 text-muted">
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-2 focus:outline-none"
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <ul className="max-h-96 overflow-y-auto nav-scroll py-2">
          {results.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No results for &ldquo;{query}&rdquo;.</li>}
          {results.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                onClick={() => goTo(item.href)}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition hover:bg-surface-2"
              >
                <span className="text-sm font-medium text-foreground">{item.title}</span>
                <span className="text-xs text-muted">{item.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
