import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import { personUrl } from '@/lib/person-url';
import { personCategoryLabel } from '@/types/person';
import { countryNameByCode } from '@/lib/countries';
import type { Person } from '@/types/person';
/** Only what a directory card renders: with hundreds of profiles, shipping biographies and careers to the browser would dominate the page. */
export type PersonCardData = Pick<Person, 'slug' | 'fullName' | 'displayName' | 'category' | 'countryCode' | 'avatarUrl' | 'avatarSeed' | 'verification'>;

export const toCardData = (p: Person): PersonCardData => ({
  slug: p.slug, fullName: p.fullName, displayName: p.displayName, category: p.category,
  countryCode: p.countryCode, avatarUrl: p.avatarUrl, avatarSeed: p.avatarSeed, verification: p.verification,
});


const hueFor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Directory-grid card for a Person, styled to match ArticleCard's editorial grid. */
export function PersonCard({ person }: { person: PersonCardData }) {
  const name = person.displayName || person.fullName;
  return (
    <Link href={personUrl(person.slug)} className="group flex flex-col h-full">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
        {person.avatarUrl ? (
          <Image
            src={person.avatarUrl.startsWith('/media/') ? `${person.avatarUrl}?w=480` : person.avatarUrl}
            alt={name}
            fill
            // /media/... is resized by its own route; the generic loader needs an absolute URL.
            unoptimized={person.avatarUrl.startsWith('/')}
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          // No licensed photo yet. A CSS initials tile instead of the generated
          // SVG silhouette: that one is several KB of inline data per card, which
          // made a 130-card directory page over 500 KB of HTML.
          <div
            className="absolute inset-0 flex items-center justify-center font-headline text-4xl font-extrabold text-white/90 transition-transform duration-700 group-hover:scale-[1.04]"
            style={{ background: `linear-gradient(145deg, hsl(${hueFor(person.avatarSeed || person.slug)} 38% 32%), hsl(${hueFor(person.slug)} 45% 22%))` }}
            aria-hidden="true"
          >
            {initialsOf(name)}
          </div>
        )}
      </div>

      <div className="pt-4 flex flex-col flex-1">
        <span className="kicker mb-2">{personCategoryLabel(person.category)}</span>

        <h3 className="font-headline text-base md:text-lg font-bold leading-snug text-slate-900 group-hover:text-news-600 transition-colors flex items-center gap-1.5">
          {name}
          {person.verification.verified && (
            <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" aria-label="Verified reference profile" />
          )}
        </h3>

        {person.countryCode && (
          <p className="mt-1 text-[13px] text-slate-500 font-medium">{countryNameByCode(person.countryCode)}</p>
        )}
      </div>
    </Link>
  );
}
