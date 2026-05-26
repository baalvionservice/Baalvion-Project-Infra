import { buildMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  reviewBoardProfiles,
  BoardMemberProfile,
  StaffProfile,
  ReviewBoardProfile,
} from "../components/data.reviewboards";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = reviewBoardProfiles.find((p) => p.slug === slug);
  if (!profile) return {};
  return buildMetadata({
    title: `${profile.name} — Imperialpedia`,
    description: `${profile.name} — ${profile.currently}. Expertise: ${profile.expertise}.`,
  });
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function LinkedInIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-4 h-4 fill-white"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// Labeled fact row — "CURRENTLY", "RESIDES IN", etc.
function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <dt className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-0.5 leading-none">
        {label}
      </dt>
      <dd className="text-[0.9375rem] text-foreground leading-snug">{value}</dd>
    </div>
  );
}

// Section heading — "Summary", "Experience", "Education", "Quote from Name"
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[1.25rem] font-bold text-foreground mb-2 leading-snug pb-1">
      {children}
    </h2>
  );
}

// ─── Left column (shared) ────────────────────────────────────────────────────

function LeftColumn({ profile }: { profile: ReviewBoardProfile }) {
  return (
    <div className="flex-shrink-0 w-full md:w-[170px]">
      {/* Photo — square, grayscale, portrait crop */}
      <div className="relative w-full md:w-[170px] aspect-[3/4] overflow-hidden">
        <Image
          src={profile.imageUrl}
          alt={profile.name}
          fill
          className="object-cover object-top "
          sizes="170px"
          priority
        />
      </div>

     

      {/* LinkedIn button */}
      {profile.linkedInUrl && (
        <Link
          href={profile.linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${profile.name} on LinkedIn`}
          className="inline-flex items-center justify-center w-8 h-8 mt-3 rounded bg-[#0A66C2] hover:bg-[#004182] transition-colors"
        >
          <LinkedInIcon />
        </Link>
      )}
    </div>
  );
}

// ─── Right column — board member layout ──────────────────────────────────────

function BoardMemberContent({ profile }: { profile: BoardMemberProfile }) {
  return (
    <div className="flex-1 min-w-0">
      {/* H1 name */}
      <h1 className="text-[2rem] font-bold text-foreground leading-tight mb-1">
        {profile.name}
      </h1>

      {/* Credentials line — CFP®, ChFC®, CLU®, RICP®, AFC®, CRC® */}
      <p className="text-[0.9375rem] text-foreground/70  mb-5 leading-snug">
        {profile.credentials}
      </p>

      {/* Labeled facts */}
      <dl className="mb-7">
        <FactRow label="Currently" value={profile.currently} />
        <FactRow label="Resides In" value={profile.residesIn} />
        <FactRow label="Education" value={profile.education} />
        <FactRow label="Expertise" value={profile.expertise} />
      </dl>

      {/* Summary */}
      <section className="mb-6">
        <SectionHeading>Summary</SectionHeading>
        <ul className="mt-3 space-y-1.5">
          {profile.summary.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[0.9375rem] text-foreground leading-relaxed"
            >
              <span className="mt-[0.48rem] flex-shrink-0 w-[5px] h-[5px] rounded-full bg-foreground" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Experience */}
      <section className="mb-6">
        <SectionHeading>Experience</SectionHeading>
        <div className="mt-3 space-y-4">
          {profile.experience.map((para, i) => (
            <p
              key={i}
              className="text-[0.9375rem] leading-relaxed text-foreground"
            >
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="mb-6">
        <SectionHeading>Education</SectionHeading>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-foreground">
          {profile.educationDetail}
        </p>
      </section>

      {/* Quote from [Name] — board members only */}
      <section>
        <SectionHeading>Quote from {profile.name}</SectionHeading>
        <div className="mt-3 space-y-3">
          <p className="text-[0.9375rem] leading-relaxed text-foreground">
            {profile.quote.text}
          </p>
          {profile.quote.context && (
            <p className="text-[0.9375rem] leading-relaxed text-foreground">
              {profile.quote.context}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Right column — staff layout ─────────────────────────────────────────────

function StaffContent({ profile }: { profile: StaffProfile }) {
  return (
    <div className="flex-1 min-w-0">
      {/* H1 name — no credentials line */}
      <h1 className="text-[2rem] font-bold text-foreground leading-tight mb-5">
        {profile.name}
      </h1>

      {/* Labeled facts */}
      <dl className="mb-7">
        <FactRow label="Currently" value={profile.currently} />
        <FactRow label="Resides In" value={profile.residesIn} />
        <FactRow label="Education" value={profile.education} />
        <FactRow label="Expertise" value={profile.expertise} />
      </dl>

      {/* Summary */}
      <section className="mb-6">
        <SectionHeading>Summary</SectionHeading>
        <ul className="mt-3 space-y-1.5">
          {profile.summary.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[0.9375rem] text-foreground leading-relaxed"
            >
              <span className="mt-[0.48rem] flex-shrink-0 w-[5px] h-[5px] rounded-full bg-foreground" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Experience */}
      <section className="mb-6">
        <SectionHeading>Experience</SectionHeading>
        <div className="mt-3 space-y-4">
          {profile.experience.map((para, i) => (
            <p
              key={i}
              className="text-[0.9375rem] leading-relaxed text-foreground"
            >
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* Education */}
      <section>
        <SectionHeading>Education</SectionHeading>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-foreground">
          {profile.educationDetail}
        </p>
      </section>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReviewBoardProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = reviewBoardProfiles.find((p) => p.slug === slug);
  if (!profile) notFound();

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col md:flex-row gap-8 md:gap-10">
          <LeftColumn profile={profile} />

          {profile.profileType === "board-member" ? (
            <BoardMemberContent profile={profile} />
          ) : (
            <StaffContent profile={profile} />
          )}
        </div>
      </div>
    </div>
  );
}