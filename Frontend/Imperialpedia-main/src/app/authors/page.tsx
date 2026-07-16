import React from 'react';
import Link from 'next/link';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { Grid } from '@/design-system/layout/grid';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPublicAuthors, CmsAuthor } from '@/services/data/cms-public';
import { getAllAuthors, AuthorProfile } from '@/config/authors';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  canonical: '/authors',
  title: 'Our Authors',
  description: "Meet the writers and analysts behind Imperialpedia's financial intelligence coverage.",
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
 * Editorial masthead. Sourced from the admin-managed cms_authors roster (see
 * admin-platform's CMS → Websites → Authors screen — add up to any number of
 * contributors there, each with a photo/video/bio), falling back to the small
 * static roster in src/config/authors.ts when the CMS has none yet.
 */
export default async function AuthorsPage() {
  const live = await getPublicAuthors();
  const authors: AuthorCardData[] = live.length ? live.map(fromCms) : getAllAuthors().map(fromStatic);

  return (
    <main className="min-h-screen bg-background pt-16">
      <Section spacing="md">
        <Container>
          <header className="mb-12 max-w-3xl">
            <Text variant="label" className="text-primary mb-4">Masthead</Text>
            <Text variant="h1" as="h1" className="mb-6">Our Authors</Text>
            <Text variant="body" className="text-muted-foreground text-lg">
              The writers and analysts researching, reporting, and fact-checking every piece of financial intelligence on Imperialpedia.
            </Text>
          </header>

          <Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="lg">
            {authors.map((author) => (
              <Link key={author.slug} href={`/authors/${author.slug}`} className="group block h-full">
                <Card className="glass-card h-full transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:border-primary/40">
                  <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <Avatar className="h-24 w-24">
                      {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
                      <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                        {initials(author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Text variant="h4" className="group-hover:text-primary transition-colors">
                        {author.name}
                      </Text>
                      <Text variant="bodySmall" className="text-primary font-semibold uppercase tracking-widest text-xs mt-1">
                        {author.title}
                      </Text>
                    </div>
                    {author.bio && (
                      <Text variant="bodySmall" className="text-muted-foreground line-clamp-3">
                        {author.bio}
                      </Text>
                    )}
                    <div className="flex items-center gap-1.5 text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      View profile <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </Grid>
        </Container>
      </Section>
    </main>
  );
}
