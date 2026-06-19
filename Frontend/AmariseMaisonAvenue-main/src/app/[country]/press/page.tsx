import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { buildAlternates } from '@/lib/seo';
import { normalizeCountry } from '@/lib/i18n/countries';
import { getPressItems } from '@/lib/cms';
import { PRESS_FALLBACK } from '@/lib/mock-data';
import { PressStrip } from '@/components/home/PressStrip';
import { BrandImage } from '@/components/ui/BrandImage';

// CMS content live per request so admin edits appear immediately.
export const dynamic = 'force-dynamic';

type PressPageProps = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: PressPageProps): Promise<Metadata> {
  const cc = normalizeCountry((await params).country);
  return {
    title: 'Press & Media | AMARISÉ MAISON AVENUE',
    description:
      'Amarisé Maison Avenue in the press — featured by the world’s leading authorities on luxury, investment and style.',
    alternates: buildAlternates(cc, '/press'),
    openGraph: {
      title: 'Press & Media | AMARISÉ MAISON AVENUE',
      description: 'The Maison and its archive, as seen in the world’s leading publications.',
      type: 'website',
    },
  };
}

export default async function PressPage({ params }: PressPageProps) {
  const countryCode = normalizeCountry((await params).country);
  const press = (await getPressItems()) ?? PRESS_FALLBACK;

  return (
    <div className="animate-fade-in bg-ivory">
      {/* Hero */}
      <section className="border-b border-border bg-white py-24">
        <div className="container mx-auto px-6 text-center">
          <nav className="mb-8 flex items-center justify-center space-x-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Link href={`/${countryCode}`} className="transition-colors hover:text-primary">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-bold text-foreground">Press</span>
          </nav>
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-plum">
            Newsroom
          </span>
          <h1 className="mt-6 font-headline text-5xl font-bold italic text-gray-900 md:text-6xl">
            {press.title}
          </h1>
          {press.subtitle && (
            <p className="mx-auto mt-6 max-w-2xl text-lg font-light italic leading-relaxed text-gray-600">
              {press.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Logo strip */}
      <PressStrip title="As Seen In" logos={press.logos} />

      {/* Coverage */}
      {press.articles.length > 0 && (
        <section className="container mx-auto px-6 py-24">
          <div className="mb-14 flex flex-col items-center space-y-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-plum">
              Featured Coverage
            </span>
            <h2 className="font-headline text-4xl font-bold italic text-gray-900">
              In the Press
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {press.articles.map((article, idx) => {
              const isExternal = article.href.startsWith('http');
              const card = (
                <article className="group flex h-full flex-col overflow-hidden border border-border bg-white transition-shadow duration-500 hover:shadow-luxury">
                  <BrandImage
                    src={article.image}
                    alt={article.title}
                    label={article.outlet}
                    className="aspect-[16/10] w-full"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="flex flex-1 flex-col gap-3 p-8">
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
                      <span>{article.outlet}</span>
                      {article.date && <span className="text-gray-300">· {article.date}</span>}
                    </div>
                    <h3 className="font-headline text-xl font-bold italic leading-snug text-gray-900">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-[13px] font-light leading-relaxed text-gray-500">
                        {article.excerpt}
                      </p>
                    )}
                    <span className="mt-auto pt-3 text-[10px] font-bold uppercase tracking-[0.28em] text-plum transition-colors group-hover:text-gold">
                      Read the Feature →
                    </span>
                  </div>
                </article>
              );
              return isExternal ? (
                <a key={idx} href={article.href} target="_blank" rel="noopener noreferrer">
                  {card}
                </a>
              ) : (
                <Link key={idx} href={`/${countryCode}${article.href === '#' ? '/journal' : article.href}`}>
                  {card}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
