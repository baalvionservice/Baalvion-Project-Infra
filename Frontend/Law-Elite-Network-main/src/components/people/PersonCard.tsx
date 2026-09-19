import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import { resolvePersonImage } from '@/lib/article-art';
import { personUrl } from '@/lib/person-url';
import { personCategoryLabel } from '@/types/person';
import { countryNameByCode } from '@/lib/countries';
import type { Person } from '@/types/person';

/** Directory-grid card for a Person, styled to match ArticleCard's editorial grid. */
export function PersonCard({ person }: { person: Person }) {
  const name = person.displayName || person.fullName;
  return (
    <Link href={personUrl(person.slug)} className="group flex flex-col h-full">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={resolvePersonImage({ avatarUrl: person.avatarUrl, name, avatarSeed: person.avatarSeed || person.slug })}
          alt={name}
          fill
          unoptimized={!person.avatarUrl}
          sizes="(max-width: 768px) 50vw, 20vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
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
