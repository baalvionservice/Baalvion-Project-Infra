"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Sparkles, Camera } from 'lucide-react';
import { PersonCard } from '@/components/people/PersonCard';

export interface SightingItem {
  id: string;
  personName: string;
  personSlug: string;
  location: string;
  quote: string;
  imageUrl?: string;
  timeAgo: string;
}

const SIGHTINGS_DATA: SightingItem[] = [
  {
    id: 'sight-1',
    personName: 'Donald Trump',
    personSlug: 'donald-trump',
    location: 'Mar-a-Lago · Palm Beach',
    quote: 'Hosting legal advisors & campaign executives for constitutional strategy briefings.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg',
    timeAgo: '2h ago',
  },
  {
    id: 'sight-2',
    personName: 'Taylor Swift',
    personSlug: 'taylor-swift',
    location: 'Electric Lady Studios · NYC',
    quote: 'Spotted leaving late-night recording session amidst re-recording copyright milestone.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_4.png',
    timeAgo: '4h ago',
  },
  {
    id: 'sight-3',
    personName: 'Elon Musk',
    personSlug: 'elon-musk',
    location: 'Chancery Court · Wilmington, DE',
    quote: 'Attending executive compensation oral arguments with corporate defense counsel.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Elon_Musk_Colorado_2022_%28cropped%29.jpg',
    timeAgo: '5h ago',
  },
  {
    id: 'sight-4',
    personName: 'Amal Clooney',
    personSlug: 'amal-clooney',
    location: 'The Hague · Netherlands',
    quote: 'Addressing international human rights tribunal panel on state accountability.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Amal_Clooney_2017.jpg',
    timeAgo: '6h ago',
  },
];

export function SixSightingsRail() {
  return (
    <section className="py-8 border-t-4 border-[#E13131] bg-slate-900 text-white p-6 rounded-sm shadow-md my-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-[#E13131] text-white p-1.5 rounded-sm">
            <Camera className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E13131] block">
              PAGE SIX EXCLUSIVE
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none mt-0.5">
              SIX SIGHTINGS &amp; SPOTTED
            </h2>
          </div>
        </div>
        <Link
          href="/people"
          className="text-[11px] font-black uppercase tracking-wider text-[#E13131] hover:text-white bg-slate-800 px-3.5 py-1.5 rounded-sm transition-colors"
        >
          View All Profiles →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SIGHTINGS_DATA.map((item) => (
          <div
            key={item.id}
            className="group bg-slate-950 border border-slate-800 hover:border-[#E13131] p-4 rounded-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-slate-800 mb-3 ring-1 ring-slate-700">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.personName}
                    fill
                    unoptimized
                    sizes="240px"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-600">
                    {item.personName}
                  </div>
                )}
                <span className="absolute bottom-2 left-2 bg-[#E13131] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-xs shadow-sm">
                  SPOTTED
                </span>
                <span className="absolute top-2 right-2 bg-black/80 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-xs">
                  {item.timeAgo}
                </span>
              </div>

              <Link href={`/people/${item.personSlug}`} className="block">
                <h3 className="font-serif text-lg font-black text-white group-hover:text-[#E13131] transition-colors leading-tight">
                  {item.personName}
                </h3>
              </Link>

              <p className="flex items-center gap-1 text-[11px] font-bold text-[#E13131] mt-1 uppercase tracking-wider">
                <MapPin className="w-3 h-3 shrink-0" /> {item.location}
              </p>

              <p className="text-[13px] text-slate-300 font-serif leading-snug mt-2 line-clamp-3">
                &ldquo;{item.quote}&rdquo;
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-850 flex justify-end">
              <Link
                href={`/people/${item.personSlug}`}
                className="text-[10.5px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                Read Profile →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
