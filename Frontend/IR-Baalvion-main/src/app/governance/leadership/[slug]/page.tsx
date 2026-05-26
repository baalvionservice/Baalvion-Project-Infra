import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { leadershipTeam, globalLeaders, VicePersidents } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { slugify } from '@/utils/slug-generator';

type LeaderSource = 'executive' | 'global' | 'president';

type Leader =
  | (typeof leadershipTeam)[number] & { source: LeaderSource }
  | ((typeof globalLeaders)[number] & { source: LeaderSource; imageId?: string; bio?: string })
  | ((typeof VicePersidents)[number] & { source: LeaderSource; imageId?: string; bio?: string });

function findLeaderBySlug(slug: string): Leader | null {
  const executive = leadershipTeam.find((member) => slugify(member.name) === slug);
  if (executive) return { ...executive, source: 'executive' };

  const global = globalLeaders.find((member) => slugify(member.name) === slug);
  if (global) return { ...global, source: 'global' };

  const president = VicePersidents.find((member) => slugify(member.name) === slug);
  if (president) return { ...president, source: 'president' };

  return null;
}

export interface SingleLeaderPageParams {
  params: { slug: string };
}

export function generateMetadata({ params }: SingleLeaderPageParams): Metadata {
  const leader = findLeaderBySlug(params.slug);
  if (!leader) return { title: 'Leader not found | Baalvion' };
  return {
    title: `${leader.name} | Leadership`,
    description: leader.bio || leader.title,
  };
}

export default function SingleLeaderPage({ params }: SingleLeaderPageParams) {
  const leader = findLeaderBySlug(params.slug);
  if (!leader) return notFound();
  console.log(leader)

  const imageId = 'imageId' in leader ? leader.imageId : undefined;
  const image =
    imageId && PlaceHolderImages.find((p) => p.id === imageId)
      ? PlaceHolderImages.find((p) => p.id === imageId)
      : PlaceHolderImages.find((p) => p.id === 'executive-2-photo');

  const firstName = leader.name.split(' ')[0];

  return (
    <div
      className="min-h-screen  bg-white text-[#333333]"
      style={{ fontFamily: '"SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif' }}
    >

      {/* ── Breadcrumb ──────────────────────────────────────── */}
      <nav className="bg-white ">
        <div className="max-w-[980px] mx-auto px-5 py-[10px] flex items-center gap-1.5 text-[12px] text-[#6e6e73]">
          <Link href="/governance/leadership" className="text-[#0066cc] hover:underline">
            Leadership
          </Link>
          <svg width="5" height="9" viewBox="0 0 5 9" fill="none" aria-hidden="true">
            <path d="M1 1l3 3.5L1 8" stroke="#6e6e73" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{leader.name}</span>
        </div>
      </nav>

      {/* ── Hero — grey background, name left + photo right ── */}
      <section className="bg-white max-w-4xl mx-auto overflow-hidden">
        <div className="max-w-[980px] mx-auto h-fit px-5 pt-12 flex flex-col-reverse items-center gap-6 sm:flex-col sm:items-end sm:justify-between  sm:pt-14">

          {/* Left — name + title */}
          <div className="w-full pb-4 text-center sm:text-left sm:pb-6 sm:flex-1 sm:min-w-0">
            <h1 className="text-[clamp(26px,4.2vw,44px)] font-semibold tracking-[-0.01em] leading-[1.07] text-black mb-2.5">
              {leader.name}
            </h1>
            <p className="text-[clamp(14px,2vw,20px)] font-normal leading-snug text-[#555555]">
              {leader.title}
            </p>
          </div>

          {/* Right — portrait, bottom-flush so it sits on the divider */}
          {image && (
            <div className="flex-shrink-0 max-h-[300px] aspect-square self-center w-full sm:self-end sm:w-[clamp(170px,30vw,330px)] sm:max-w-none leading-[0]">
              <Image
                src={image.imageUrl}
                alt={leader.name}
                data-ai-hint={image.imageHint}
                width={230}
                height={210}
                className="block w-full  h-full object-cover object-top"
                priority
              />
            </div>
          )}

        </div>
      </section>

      {/* ── Bio — white, two-column text ─────────────────────── */}
      <section className="bg-white">
        <div className="max-w-[980px] mx-auto px-5 py-11 grid grid-cols-1  gap-5 md:gap-x-12">

          <div className="flex flex-col gap-5">
            {leader.bio ? (
              <p className="text-[15px] leading-[1.78] text-[#333333]">{leader.bio}</p>
            ) : (
              <p className="text-[15px] leading-[1.78] text-[#333333]">
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.{firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.

              </p>
            )}
          </div>



        </div>
      </section>

    </div>
  );
}