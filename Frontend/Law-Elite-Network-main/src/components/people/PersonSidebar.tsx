import React from 'react';
import { Globe, MapPin, Calendar, ShieldCheck } from 'lucide-react';
import { AdSlot } from '@/components/ads/AdSlot';
import { countryNameByCode } from '@/lib/countries';
import { formatArticleDate } from '@/lib/format-date';
import type { Person } from '@/types/person';

const SOCIAL_LABELS: Record<string, string> = {
  x: 'X', instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn',
  youtube: 'YouTube', tiktok: 'TikTok', wikipedia: 'Wikipedia',
};

// Same literal reused by every other ad placement in this app (ArticleSidebar,
// category page hero) -- AD_PLACEMENTS is a plain-data const exported from a
// 'use client' file, which resolves to an empty client-reference stub when
// imported into a server component (see the article-design-port memory).
const SIDEBAR_AD_SLOT_ID = '4123514154';

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-xl p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">{title}</h3>
      {children}
    </div>
  );
}

export function PersonSidebar({ person }: { person: Person }) {
  const socialEntries = person.social ? Object.entries(person.social).filter(([, url]) => url) : [];

  return (
    <aside className="space-y-5 lg:sticky lg:top-28">
      <SidebarCard title="Quick Facts">
        <ul className="space-y-2.5 text-[14px] text-slate-700">
          {person.countryCode && (
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {countryNameByCode(person.countryCode)}</li>
          )}
          {person.birthDate && (
            <li className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              Born {formatArticleDate(person.birthDate)}{person.birthPlace ? `, ${person.birthPlace}` : ''}
            </li>
          )}
          {person.deathDate && (
            <li className="flex items-center gap-2 pl-6">Died {formatArticleDate(person.deathDate)}</li>
          )}
        </ul>
      </SidebarCard>

      {(person.officialWebsite || socialEntries.length > 0) && (
        <SidebarCard title="Official Links">
          <div className="space-y-2">
            {person.officialWebsite && (
              <a
                href={person.officialWebsite}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex items-center gap-2 text-[14px] font-semibold text-blue-600 hover:underline"
              >
                <Globe className="w-4 h-4 shrink-0" /> Official Website
              </a>
            )}
            {socialEntries.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
                {socialEntries.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-[13px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-tight"
                  >
                    {SOCIAL_LABELS[key] || key}
                  </a>
                ))}
              </div>
            )}
          </div>
        </SidebarCard>
      )}

      <SidebarCard title="Sources & Verification">
        <div className="flex items-start gap-2 text-[13.5px] text-slate-600 leading-relaxed">
          <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${person.verification.verified ? 'text-blue-600' : 'text-slate-400'}`} />
          <div>
            <p className="font-semibold text-slate-800">
              {person.verification.verified ? 'Verified reference profile' : 'Unverified — pending review'}
            </p>
            {person.verification.sourceNote && <p className="mt-1">{person.verification.sourceNote}</p>}
            {person.verification.lastReviewedAt && (
              <p className="mt-1 text-slate-400">Last reviewed {formatArticleDate(person.verification.lastReviewedAt)}</p>
            )}
          </div>
        </div>
      </SidebarCard>

      <AdSlot slotId={SIDEBAR_AD_SLOT_ID} format="rectangle" placement="person-sidebar" minHeight="250px" />
    </aside>
  );
}
