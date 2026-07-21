import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { ShieldCheck, BadgeCheck } from 'lucide-react';
import type { ResolvedAuthor } from '@/services/data/cms-public';

interface AuthorCredibilityCardProps {
  author: ResolvedAuthor;
  reviewer?: ResolvedAuthor | null;
  reviewedAt?: string;
  factChecker?: ResolvedAuthor | null;
  factCheckedAt?: string;
}

// Pinned to UTC — see ArticleHeader.tsx for why (SSR/hydration date-mismatch avoidance).
const reviewedDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * Author bio/credentials/experience block rendered directly on the article — the E-E-A-T
 * trust signals Google expects for YMYL finance content, surfaced here rather than only on
 * the standalone /authors/[slug] page. Three distinct editorial roles can appear: the
 * byline author ("Written by"), an editorial reviewer ("Reviewed for accuracy"), and a
 * fact-checker ("Fact-checked by") — each optional and shown only when the article names
 * that role via CMS customFields (authorSlug / reviewerSlug / factCheckerSlug).
 */
export const AuthorCredibilityCard = ({
  author,
  reviewer,
  reviewedAt,
  factChecker,
  factCheckedAt,
}: AuthorCredibilityCardProps) => {
  const credentialsLine = [author.title, author.credentials].filter(Boolean).join(' · ');

  return (
    <Card className="border bg-muted/30 mb-12">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-5 sm:items-start">
          <Avatar className="h-16 w-16 shrink-0 ring-2 ring-background shadow-md border border-primary/20">
            {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
              {initials(author.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <Text variant="bodySmall" className="text-muted-foreground uppercase tracking-widest font-bold text-[10px] mb-1">
                Written by
              </Text>
              <Link href={`/authors/${author.slug}`} className="font-bold text-lg text-foreground hover:text-primary transition-colors">
                {author.name}
              </Link>
              {credentialsLine && (
                <Text variant="bodySmall" className="text-muted-foreground">
                  {credentialsLine}
                </Text>
              )}
            </div>

            {author.bio && (
              <Text variant="bodySmall" className="text-foreground/80 leading-relaxed">
                {author.bio}
              </Text>
            )}

            {author.expertise?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {author.expertise.map((topic) => (
                  <Badge key={topic} variant="secondary" className="text-[10px] font-semibold">
                    {topic}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {reviewer && (
          <div className="mt-6 pt-5 border-t flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Reviewed for accuracy</span> by{' '}
              <Link href={`/authors/${reviewer.slug}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                {reviewer.name}
              </Link>
              {[reviewer.title, reviewer.credentials].filter(Boolean).length > 0 && (
                <>, {[reviewer.title, reviewer.credentials].filter(Boolean).join(' · ')}</>
              )}
              {reviewedAt && (
                <> — last reviewed {reviewedDateFormatter.format(new Date(reviewedAt))}</>
              )}
            </Text>
          </div>
        )}

        {factChecker && (
          <div className={`pt-5 flex items-start gap-3 ${reviewer ? 'mt-4' : 'mt-6 pt-5 border-t'}`}>
            <BadgeCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Fact-checked by</span>{' '}
              <Link href={`/authors/${factChecker.slug}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                {factChecker.name}
              </Link>
              {[factChecker.title, factChecker.credentials].filter(Boolean).length > 0 && (
                <>, {[factChecker.title, factChecker.credentials].filter(Boolean).join(' · ')}</>
              )}
              {factCheckedAt && (
                <> — last checked {reviewedDateFormatter.format(new Date(factCheckedAt))}</>
              )}
            </Text>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
