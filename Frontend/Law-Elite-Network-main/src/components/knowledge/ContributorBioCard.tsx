"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { resolvePersonImage } from '@/lib/article-art';

interface ContributorBioCardProps {
  name: string;
  avatarUrl?: string;
  avatarSeed?: string;
  /** Plain-text bio; falls back to a generic editorial-team line when a byline has no matched profile. */
  bio?: string;
  /** Present when the contributor has a real profile page to link to. */
  profileSlug?: string;
  /** e.g. "Reviewed by" / "Fact checked by" -- shown as a small header above the photo. Omitted for the primary "Written by" byline, matching the reference design. */
  roleLabel?: string;
  /**
   * Extra verified-only detail lines shown under the bio (e.g. jurisdiction,
   * bar/license, review date on the reviewer card). Never inferred or
   * defaulted by the caller -- see the no-fabrication rule on `reviewerBarLicense`
   * in ReviewedBy.tsx.
   */
  metaLines?: string[];
}

const FALLBACK_BIO =
  'Part of the Law Elite Network editorial team. Our guides are researched and reviewed for accuracy and clarity, ' +
  'then kept current as laws change. They provide general legal information, not legal advice.';

/**
 * Shared hover/click bio card for every contributor byline (author, reviewer,
 * and any future fact-checker role) -- photo + bio + "Full Bio" link, then a
 * divider and an "editorial policies" footer line. One component so the
 * three roles render identically instead of drifting apart, matching the
 * By / Reviewed by / Fact checked by pattern this was modeled on.
 */
export function ContributorBioCard({ name, avatarUrl, avatarSeed, bio, profileSlug, roleLabel, metaLines }: ContributorBioCardProps) {
  return (
    <div className="p-6 space-y-4">
      {roleLabel && (
        <p className="text-[13px] text-slate-500">
          {roleLabel} <span className="font-bold text-slate-900">{name}</span>
        </p>
      )}

      <div className="flex gap-4">
        <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100">
          <Image
            src={resolvePersonImage({ avatarUrl, name, avatarSeed })}
            alt={name}
            fill
            className="object-cover grayscale"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-[13.5px] leading-relaxed text-slate-600 line-clamp-4">
            {bio || FALLBACK_BIO}
          </p>
          {metaLines && metaLines.length > 0 && (
            <p className="text-[12px] text-slate-500 space-x-2">
              {metaLines.map((line, i) => (
                <span key={i}>{i > 0 && <span className="text-slate-300">·</span>} {line}</span>
              ))}
            </p>
          )}
          {profileSlug && (
            <Link
              href={`/author/${profileSlug}`}
              className="inline-block text-[13px] font-bold text-blue-700 hover:text-blue-900 transition-colors"
            >
              Full Bio →
            </Link>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100">
        <p className="text-[12px] text-slate-500">
          Learn about our{' '}
          <Link href="/editorial-process" className="text-blue-600 hover:underline">editorial policies</Link>.
        </p>
      </div>
    </div>
  );
}
