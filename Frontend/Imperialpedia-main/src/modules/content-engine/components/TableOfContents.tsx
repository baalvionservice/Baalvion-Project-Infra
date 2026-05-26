'use client';

import React, { useEffect, useState } from 'react';
import { ContentSection } from '../types';
import { slugify } from '../utils/slugify';
import { cn } from '@/lib/utils';
import { Text } from '@/design-system/typography/text';
import { List } from 'lucide-react';

interface TOCEntry {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  sections: ContentSection[];
  className?: string;
}

/**
 * Automatically generates a Table of Contents from article sections and heading blocks.
 * Supports nesting, smooth scrolling, and active section highlighting.
 */
export const TableOfContents = ({ sections, className }: TableOfContentsProps) => {
  const [entries, setEntries] = useState<TOCEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // Extract headings from sections and their blocks
    const headingEntries: TOCEntry[] = [];
    
    sections.forEach((section) => {
      if (section.title) {
        headingEntries.push({
          id: slugify(section.title),
          text: section.title,
          level: 2,
        });
      }

      section.blocks.forEach((block) => {
        if (block.type === 'heading') {
          headingEntries.push({
            id: slugify(block.content as string),
            text: block.content as string,
            level: block.metadata?.level || 2,
          });
        }
      });
    });

    setEntries(headingEntries);
  }, [sections]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveId(visibleEntry.target.id);
        }
      },
      { rootMargin: '-100px 0% -80% 0%' }
    );

    entries.forEach((entry) => {
      const element = document.getElementById(entry.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [entries]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth',
      });
    }
  };

  if (entries.length === 0) return null;

  return (
    <nav className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-4 text-primary">
        <List className="w-5 h-5" />
        <Text variant="label" weight="bold">Table of Contents</Text>
      </div>
      
      <ul className="space-y-2 border-l-2 border-muted pl-4">
        {entries.map((entry) => (
          <li 
            key={entry.id} 
            className={cn(
              "transition-all duration-200",
              entry.level === 3 && "pl-4",
              entry.level === 4 && "pl-8"
            )}
          >
            <a
              href={`#${entry.id}`}
              onClick={(e) => handleClick(e, entry.id)}
              className={cn(
                "block text-sm py-1 hover:text-primary transition-colors",
                activeId === entry.id 
                  ? "text-primary font-bold translate-x-1" 
                  : "text-muted-foreground"
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
