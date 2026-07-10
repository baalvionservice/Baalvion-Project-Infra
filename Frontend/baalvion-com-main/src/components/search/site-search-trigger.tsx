'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SEARCH_INDEX, type SearchEntry } from '@/lib/search-index';

const MAX_RESULTS = 8;

function matches(entry: SearchEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return entry.title.toLowerCase().includes(q) || entry.description.toLowerCase().includes(q);
}

/** Header search trigger + the Cmd/Ctrl-K command palette it opens. One
 *  client island so the rest of the header can stay a server component. */
export function SiteSearchTrigger() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const results = useMemo(
    () => SEARCH_INDEX.filter((entry) => matches(entry, query)).slice(0, MAX_RESULTS),
    [query]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const go = (entry: SearchEntry) => {
    close();
    if (entry.external) {
      window.location.href = entry.href;
    } else {
      router.push(entry.href);
    }
  };

  // Global Cmd/Ctrl+K to open, from anywhere on the page.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      inputRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function onDialogKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const entry = results[activeIndex];
      if (entry) go(entry);
      return;
    }
    if (e.key === 'Tab') {
      // Minimal focus trap: the dialog only ever contains the input and the
      // result links, so wrap at either end rather than escape to the page.
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('input, a[href]');
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search Baalvion"
        className="flex items-center gap-2 border hairline px-3 py-1.5 text-sm text-muted transition-colors duration-200 hover:border-line-strong hover:text-foreground"
      >
        <span aria-hidden="true">⌕</span>
        <span className="hidden md:inline">Search</span>
        <span aria-hidden="true" className="mono-caption hidden rounded-sm border hairline px-1.5 py-0.5 md:inline">
          ⌘K
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24 sm:pt-32">
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 bg-ink-deep/80 backdrop-blur-sm"
            onClick={close}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search Baalvion"
            onKeyDown={onDialogKeyDown}
            className="relative w-full max-w-xl border hairline-strong bg-ink shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b hairline px-5 py-4">
              <span aria-hidden="true" className="text-muted-2">⌕</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, platforms, brands…"
                aria-label="Search query"
                aria-controls="search-results"
                aria-activedescendant={results[activeIndex] ? `search-result-${activeIndex}` : undefined}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-2 focus:outline-none"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="mono-caption shrink-0 border hairline px-2 py-1 text-muted transition-colors hover:text-foreground"
              >
                Esc
              </button>
            </div>

            <ul id="search-results" role="listbox" aria-label="Search results" className="max-h-96 overflow-y-auto">
              {results.length === 0 && (
                <li className="body px-5 py-6 text-sm text-muted">No pages match “{query}”.</li>
              )}
              {results.map((entry, i) => (
                <li key={entry.href} id={`search-result-${i}`} role="option" aria-selected={i === activeIndex}>
                  <a
                    href={entry.href}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={(e) => {
                      e.preventDefault();
                      go(entry);
                    }}
                    className={`block px-5 py-3.5 transition-colors duration-150 ${
                      i === activeIndex ? 'bg-surface-2' : ''
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-medium text-foreground">{entry.title}</span>
                      {entry.external && <span aria-hidden="true" className="mono-caption text-muted-2">↗</span>}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{entry.description}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
