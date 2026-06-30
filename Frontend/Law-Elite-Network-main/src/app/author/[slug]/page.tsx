"use client";

import React, { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Linkedin, Twitter, BookOpen, Loader2 } from 'lucide-react';
import { getAuthorBySlug, authorNameToSlug, type LawAuthor } from '@/data/authors';
import { getAllArticles, type LawArticle } from '@/data/law-content';

export default function AuthorProfilePage() {
  const { slug } = useParams();
  const bundled = typeof slug === 'string' ? getAuthorBySlug(slug) : null;
  const [author, setAuthor] = useState<LawAuthor | null>(bundled);
  const [loading, setLoading] = useState(!bundled);
  const [missing, setMissing] = useState(false);

  // Source-of-truth order: central CMS first (admin-created contributors), then
  // the bundled baseline. The bundle covers all current bylines so most renders
  // are instant; CMS-only authors resolve via the same-origin BFF.
  useEffect(() => {
    if (typeof slug !== 'string') return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/cms/authors/${slug}`);
        if (!cancelled && r.ok) {
          const j = await r.json();
          if (j?.data) {
            const d = j.data;
            setAuthor({
              slug: d.slug,
              name: d.name,
              title: d.title || '',
              credentials: d.credentials || '',
              bio: d.bio || '',
              expertise: Array.isArray(d.expertise) ? d.expertise : [],
              avatarSeed: d.slug,
              avatarUrl: d.avatarUrl || undefined,
              social: d.social || undefined,
            });
            setLoading(false);
            return;
          }
        }
      } catch {
        /* ignore — fall back to bundled */
      }
      if (cancelled) return;
      if (!bundled) setMissing(true);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, bundled]);

  if (missing) notFound();
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center pt-48 pb-48">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
        <PublicFooter />
      </div>
    );
  }
  if (!author) return null;

  // Match a byline ("Elena Rossi") to this profile by its normalized slug.
  const articles: LawArticle[] = getAllArticles()
    .filter((a) => authorNameToSlug(a.author) === author.slug)
    .sort((a, b) => b.views - a.views);

  const avatar = author.avatarUrl || `https://picsum.photos/seed/${author.avatarSeed}/600/600`;
  const bioParagraphs = author.bio.split('\n').map((p) => p.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-5xl">

          <nav aria-label="Breadcrumb" className="mb-10 text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-slate-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/authors" className="hover:text-slate-700">Contributors</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700">{author.name}</span>
          </nav>

          <header className="flex flex-col sm:flex-row gap-8 items-start pb-12 mb-12 border-b border-slate-100">
            <div className="relative w-32 h-32 shrink-0 rounded-3xl overflow-hidden bg-slate-100 shadow-md">
              <Image src={avatar} alt={author.name} fill className="object-cover" data-ai-hint="professional portrait" />
            </div>
            <div className="flex-1">
              <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">{author.title}</span>
              <h1 className="text-[40px] md:text-[52px] font-bold text-slate-900 tracking-tight font-serif leading-tight mt-1 mb-3">
                {author.name}
              </h1>
              <p className="text-base text-slate-500 font-medium mb-5">{author.credentials}</p>

              <div className="flex flex-wrap items-center gap-3">
                {author.expertise.map((area) => (
                  <span key={area} className="text-[12px] font-semibold text-slate-600 bg-slate-100 rounded-full px-3 py-1.5">
                    {area}
                  </span>
                ))}
                {author.social?.linkedin && (
                  <a href={author.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${author.name} on LinkedIn`} className="text-slate-400 hover:text-blue-600 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {author.social?.x && (
                  <a href={author.social.x} target="_blank" rel="noopener noreferrer" aria-label={`${author.name} on X`} className="text-slate-400 hover:text-blue-600 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </header>

          <section className="max-w-3xl mb-16">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">About {author.name.split(' ')[0]}</h2>
            <div className="space-y-5 text-[18px] leading-[1.7] text-slate-700 font-serif">
              {bioParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-10 pt-4 border-t-4 border-blue-600">
              <BookOpen className="w-6 h-6 text-blue-600 mt-4" />
              <h2 className="text-3xl font-bold text-slate-900 pt-4">
                Guides by {author.name.split(' ')[0]}{' '}
                <span className="text-slate-400 font-medium text-xl">({articles.length})</span>
              </h2>
            </div>

            {articles.length === 0 ? (
              <p className="text-slate-500 italic">No published guides yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {articles.map((art) => (
                  <Link key={art.id} href={`/article/${art.slug}`} className="group block h-full">
                    <div className="bg-white border border-slate-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col h-full">
                      <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                        <Image
                          src={`https://picsum.photos/seed/${art.imageSeed}/400/260`}
                          alt={art.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          data-ai-hint="legal dossier"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight mb-2">
                          {art.category.name}
                        </span>
                        <h3 className="text-[17px] font-bold text-slate-900 leading-[1.3] mb-3 group-hover:text-blue-700 transition-colors line-clamp-3">
                          {art.title}
                        </h3>
                        <p className="mt-auto pt-2 text-[12px] font-medium text-slate-400">
                          {art.readingTime} min read · {art.updatedAt}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
