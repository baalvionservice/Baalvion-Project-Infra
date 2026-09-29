'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type JumpSection = { id: string; label: string };

/**
 * The "Jump To" bar.
 *
 * Taken from the reference job page, which renders it as a solid pink (#fc9bb3) band
 * directly under the apply button: a centred flex row of bold 16px black anchor links
 * (`.ajd_navigation{background-color:#fc9bb3}`, `.ajd_navigation__a{color:#000;
 * font-size:16px;font-weight:bold}`). Their markup carries a `singular-highlighting`
 * class, so the current section is marked as you scroll — that is what this adds.
 *
 * It sticks to the top here. Theirs does not, but a long posting is exactly where you
 * want the section links to stay reachable, and it costs nothing.
 */
export function JobJumpNav({ sections }: { sections: JumpSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // The heading nearest the top of the viewport wins, so the highlight tracks
        // reading position rather than flickering between two visible sections.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // Top band only: a section counts as "current" once its heading reaches the
      // upper third of the screen.
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav aria-label="Jump to a section" className="sticky top-0 z-30 bg-brand-pink">
      <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-center gap-x-1 gap-y-1 px-5 py-2.5">
        <span className="pr-2 text-base font-bold text-black">Jump to:</span>
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? 'true' : undefined}
            className={cn(
              'px-2.5 py-1 text-base font-bold text-black underline-offset-4 hover:underline',
              active === section.id && 'underline decoration-2',
            )}
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
