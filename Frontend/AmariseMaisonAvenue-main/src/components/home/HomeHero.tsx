import Link from "next/link";
import { BrandImage } from "@/components/ui/BrandImage";
import type { HomepageHero } from "@/lib/cms";

interface HomeHeroProps {
  hero: HomepageHero;
  countryCode: string;
}

/** Full-bleed editorial hero. Image + copy + CTAs are all admin-editable; a missing
 *  image degrades to the branded panel via <BrandImage>. */
export function HomeHero({ hero, countryCode }: HomeHeroProps) {
  const href = (path: string) =>
    path.startsWith("/") ? `/${countryCode}${path}` : path;

  return (
    <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden bg-ivory">
      <BrandImage
        src={hero.image}
        alt={hero.title}
        priority
        className="absolute inset-0 h-full w-full"
        imgClassName="object-cover"
        sizes="100vw"
      />
      {/* Legibility scrim — strong enough that white copy stays readable over both a
          rich photo and the cream branded-panel fallback (before a hero image is uploaded). */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/30" />

      <div className="relative z-10 flex h-full flex-col items-center justify-end pb-20 sm:justify-center sm:pb-0">
        <div className="max-w-3xl space-y-7 px-6 text-center text-white">
          {hero.eyebrow && (
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/85">
              {hero.eyebrow}
            </span>
          )}
          <h1 className="font-headline text-5xl font-bold italic leading-[1.05] sm:text-6xl md:text-7xl">
            {hero.title}
          </h1>
          {hero.subtitle && (
            <p className="mx-auto max-w-2xl text-base font-light leading-relaxed text-white/90 sm:text-lg">
              {hero.subtitle}
            </p>
          )}
          <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
            <Link
              href={href(hero.ctaHref)}
              className="h-14 min-w-[220px] bg-white px-10 text-[10px] font-bold uppercase tracking-[0.32em] text-black transition-colors hover:bg-gold hover:text-black flex items-center justify-center"
            >
              {hero.ctaLabel}
            </Link>
            {hero.secondaryCtaLabel && hero.secondaryCtaHref && (
              <Link
                href={href(hero.secondaryCtaHref)}
                className="h-14 min-w-[220px] border border-white/80 px-10 text-[10px] font-bold uppercase tracking-[0.32em] text-white transition-colors hover:bg-white hover:text-black flex items-center justify-center"
              >
                {hero.secondaryCtaLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
