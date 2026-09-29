import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import { articleArtDataUri } from '@baalvion/illustrations';
import { entertainmentUrl } from '@/lib/entertainment-url';
import { entertainmentTypeLabel } from '@/types/entertainment';
import type { EntertainmentEntity } from '@/types/entertainment';

/** Directory-grid card for an EntertainmentEntity, styled to match PersonCard/ArticleCard. */
export function EntertainmentCard({ entity }: { entity: EntertainmentEntity }) {
  const photoUrl = entity.images?.[0]?.url;
  const ownPhoto = !!photoUrl && photoUrl.startsWith('/media/');
  const image = (ownPhoto ? `${photoUrl}?w=480` : photoUrl)
    || articleArtDataUri({ title: entity.title, category: entertainmentTypeLabel(entity.type), seed: entity.slug });

  return (
    <Link href={entertainmentUrl(entity.slug)} className="group flex flex-col h-full">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={image}
          alt={entity.title}
          fill
          // /media/... is resized by its own route; the generic loader needs an absolute URL.
          unoptimized={!photoUrl || ownPhoto}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>

      <div className="pt-4 flex flex-col flex-1">
        <span className="kicker mb-2">{entertainmentTypeLabel(entity.type)}</span>

        <h3 className="font-headline text-base md:text-lg font-bold leading-snug text-slate-900 group-hover:text-news-600 transition-colors flex items-center gap-1.5">
          {entity.title}
          {entity.verification.verified && (
            <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" aria-label="Verified reference profile" />
          )}
        </h3>

        {entity.releaseDate && (
          <p className="mt-1 text-[13px] text-slate-500 font-medium">{new Date(entity.releaseDate).getFullYear()}</p>
        )}
      </div>
    </Link>
  );
}
