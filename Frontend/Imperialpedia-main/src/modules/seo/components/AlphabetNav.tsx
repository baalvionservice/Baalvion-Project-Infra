'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AlphabetNavProps } from '../types/glossary-types';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * A sophisticated A-Z navigation bar for the glossary.
 */
export const AlphabetNav = ({ activeLetter }: AlphabetNavProps) => {
  return (
    <nav className="flex flex-wrap justify-center gap-1 md:gap-2 py-6 border-y mb-12">
      <Link
        href="/glossary"
        className={cn(
          "px-3 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-tighter",
          !activeLetter ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
        )}
      >
        All
      </Link>
      {alphabet.map((letter) => {
        const isActive = activeLetter?.toUpperCase() === letter;
        return (
          <Link
            key={letter}
            href={`/glossary/${letter.toLowerCase()}`}
            className={cn(
              "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all",
              isActive 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" 
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            {letter}
          </Link>
        );
      })}
    </nav>
  );
};
