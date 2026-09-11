import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPublicAuthors, CmsAuthor } from '@/services/data/cms-public';
import { getAllAuthors, AuthorProfile } from '@/config/authors';
import { isAuthorHiddenInCleanupMode } from '@/config/adsense-cleanup';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  canonical: '/authors',
  title: 'Editorial Board & Authors — Imperialpedia Masthead',
  description: "Meet the certified financial writers, reviewers, and analysts behind Imperialpedia's intelligence coverage.",
  ogType: 'website',
});

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

interface AuthorCardData {
  slug: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
}

const fromCms = (a: CmsAuthor): AuthorCardData => ({
  slug: a.slug,
  name: a.name,
  title: a.title || 'Contributor',
  bio: a.bio || '',
  avatarUrl: a.avatarUrl || undefined,
});

const fromStatic = (a: AuthorProfile): AuthorCardData => ({
  slug: a.slug,
  name: a.name,
  title: a.title,
  bio: a.bio,
  avatarUrl: a.avatarUrl,
});

/**
 * Imperialpedia Editorial Masthead Directory Page
 */
export default async function AuthorsPage() {
  const live = await getPublicAuthors();
  const rawAuthors: AuthorCardData[] = live.length ? live.map(fromCms) : getAllAuthors().map(fromStatic);
  const authors = rawAuthors.filter((a) => !isAuthorHiddenInCleanupMode(a.slug));

  return (
    <main className="min-h-screen bg-[#f9f9fb] dark:bg-black pt-12 pb-20">
      <Section spacing="md">
        <Container>
          {/* ── Imperialpedia Header ── */}
          <header className="mb-12 max-w-4xl space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="bg-[#c8102e] text-white text-xs font-black uppercase tracking-tighter px-3 py-1 -skew-x-12 inline-block shadow-xs">
                IMPERIALPEDIA MASTHEAD
              </span>
              <span className="text-xs font-mono font-black uppercase tracking-widest text-[#c8102e]">
                // EDITORIAL BOARD &amp; AUTHORS
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black dark:text-white tracking-tighter uppercase font-serif leading-none">
              OUR AUTHORS &amp; ANALYSTS
            </h1>

            <div className="border-l-6 border-[#c8102e] bg-white dark:bg-slate-900 p-5 border-3 border-black dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(200,16,46,0.3)]">
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
                The certified financial experts, CFPs, economists, and market analysts researching, reporting, and fact-checking every piece of intelligence on Imperialpedia.
              </p>
            </div>
          </header>

          {/* ── Author Cards Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {authors.map((author) => (
              <Link key={author.slug} href={`/authors/${author.slug}`} className="group block h-full">
                <div className="bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(200,16,46,0.3)] hover:-translate-y-1 transition-all h-full flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />

                  <div className="flex flex-col items-center text-center gap-4 pt-2">
                    <Avatar className="h-24 w-24 border-3 border-black dark:border-white shadow-md">
                      {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} className="object-cover" />}
                      <AvatarFallback className="text-xl font-black bg-black text-[#c8102e]">
                        {initials(author.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <span className="bg-black text-white text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 inline-block mb-1">
                        AUTHOR PROFILE
                      </span>
                      <h2 className="text-xl font-black text-black dark:text-white uppercase font-serif group-hover:text-[#c8102e] transition-colors leading-snug">
                        {author.name}
                      </h2>
                      <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#c8102e]">
                        {author.title}
                      </p>
                    </div>

                    {author.bio && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed line-clamp-3">
                        {author.bio}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-3 border-t-2 border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#c8102e] group-hover:text-black dark:group-hover:text-white transition-colors">
                      VIEW FULL PROFILE →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
