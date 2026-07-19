import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Section } from '@/components/ui/Section';
import { Newspaper } from 'lucide-react';
import { getCompanyRecentNews } from '@/lib/data/companyNews';
import { CompanyEntity } from '@/types/entity';

interface CompanyNewsProps {
  company: CompanyEntity;
}

/**
 * Self-fetching "Recent News" section — mirrors LiveQuoteCard's pattern of owning its
 * own data so it can sit behind a Suspense boundary and stream in without delaying the
 * rest of the company page. Renders nothing when no real coverage is found.
 */
export const CompanyNews = async ({ company }: CompanyNewsProps) => {
  const news = await getCompanyRecentNews(company);
  if (news.length === 0) return null;

  return (
    <Section title="Recent News" className="animate-in fade-in duration-1000 delay-400">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.map((item) => (
          // Author byline is a separate link outside the card's own anchor — anchors
          // cannot nest, so the two links are siblings rather than parent/child.
          <Card key={item.slug} className="glass-card border-none h-full hover:bg-white/5 transition-all duration-300">
            <Link href={item.url} className="group block h-full">
              <CardContent className="p-6 pb-2 flex flex-col gap-3">
                <Newspaper className="h-4 w-4 text-primary opacity-60" />
                <Text variant="bodySmall" weight="bold" className="group-hover:text-primary transition-colors leading-snug">
                  {item.title}
                </Text>
                <Text variant="caption" className="text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </Text>
              </CardContent>
            </Link>
            {item.authorName && item.authorSlug && (
              <div className="px-6 pb-6">
                <Link
                  href={`/authors/${item.authorSlug}`}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  By {item.authorName}
                </Link>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Section>
  );
};
