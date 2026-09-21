"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, Eye, ArrowRight } from 'lucide-react';

export interface GalleryPhoto {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  credit: string;
  caption: string;
  linkHref?: string;
}

const PHOTOS_DATA: GalleryPhoto[] = [
  {
    id: 'photo-1',
    title: 'Donald Trump Official Portrait & Legal Filings',
    category: 'COURT CAMERAS',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg',
    credit: 'White House / Shealah Craighead',
    caption: 'Presidential immunity docket oral arguments before the U.S. Supreme Court.',
    linkHref: '/people/donald-trump',
  },
  {
    id: 'photo-2',
    title: 'Taylor Swift at MTV Video Music Awards',
    category: 'PAGE SIX PHOTOS',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_4.png',
    credit: 'Eva Rinaldi / Wikimedia Commons',
    caption: 'Taylor Swift attending major industry event amidst master re-recording catalog milestone.',
    linkHref: '/people/taylor-swift',
  },
  {
    id: 'photo-3',
    title: 'Elon Musk at U.S. Air Force Symposium',
    category: 'EXECUTIVE SPOTLIGHT',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Elon_Musk_Colorado_2022_%28cropped%29.jpg',
    credit: 'Trevor Cokley / U.S. Air Force',
    caption: 'Tesla & SpaceX CEO addressing tech leadership panel during Chancery proceedings.',
    linkHref: '/people/elon-musk',
  },
  {
    id: 'photo-4',
    title: 'Amal Clooney International Legal Address',
    category: 'LEGAL COURT CAMERAS',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Amal_Clooney_2017.jpg',
    credit: 'Voice of America',
    caption: 'International human rights barrister Amal Clooney presenting international law briefing.',
    linkHref: '/people/amal-clooney',
  },
];

export function PhotoGalleryCarousel() {
  return (
    <section className="py-8 bg-white border border-slate-200 rounded-sm p-6 my-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-[#E13131] pb-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-[#E13131] text-white p-2 rounded-sm shadow-md">
            <Camera className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E13131] block">
              PAGE SIX EXCLUSIVE GALLERY
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 leading-none mt-1">
              PHOTOS &amp; COURT CAMERAS
            </h2>
          </div>
        </div>
        <Link
          href="/galleries"
          className="text-[12px] font-black uppercase tracking-wider text-[#E13131] hover:text-slate-900 transition-colors flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-sm"
        >
          View Full Galleries <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PHOTOS_DATA.map((photo) => (
          <div key={photo.id} className="group flex flex-col justify-between border border-slate-200 rounded-sm p-3 hover:border-[#E13131] hover:shadow-md transition-all bg-slate-50">
            <div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-slate-900 mb-3">
                <Image
                  src={photo.imageUrl}
                  alt={photo.title}
                  fill
                  unoptimized
                  sizes="300px"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-2 left-2 bg-[#E13131] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-xs shadow-sm">
                  {photo.category}
                </span>
              </div>

              <h3 className="font-serif text-base font-bold text-slate-900 group-hover:text-[#E13131] transition-colors line-clamp-2">
                {photo.title}
              </h3>

              <p className="text-[12px] text-slate-600 font-serif leading-snug mt-2 line-clamp-2">
                {photo.caption}
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span className="truncate max-w-[150px]">Photo: {photo.credit}</span>
              {photo.linkHref && (
                <Link href={photo.linkHref} className="text-[#E13131] font-bold hover:underline shrink-0">
                  Profile →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
