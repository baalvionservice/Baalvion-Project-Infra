import Link from "next/link";
import { BrandImage } from "@/components/ui/BrandImage";
import { isRealImage } from "@/lib/image-utils";
import type { PressLogo } from "@/lib/cms";

interface PressStripProps {
  title: string;
  subtitle?: string;
  logos: PressLogo[];
}

/** "As seen in" press logo row. Real logo images render as <img>; until assets are
 *  uploaded in admin, the outlet name renders as a refined wordmark. */
export function PressStrip({ title, subtitle, logos }: PressStripProps) {
  if (!logos.length) return null;

  return (
    <section className="border-t border-border bg-white py-20">
      <div className="container mx-auto px-6 text-center">
        {title && (
          <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="mx-auto mt-3 max-w-xl text-[13px] font-light italic text-gray-500">
            {subtitle}
          </p>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:gap-x-20">
          {logos.map((logo, idx) => {
            const content = isRealImage(logo.image) ? (
              <BrandImage
                src={logo.image}
                alt={logo.name}
                className="h-10 w-32"
                imgClassName="object-contain"
                sizes="128px"
              />
            ) : (
              <span className="font-headline text-2xl italic text-gray-400 transition-colors hover:text-gray-700">
                {logo.name}
              </span>
            );
            return logo.href && logo.href !== "#" ? (
              <Link
                key={idx}
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                {content}
              </Link>
            ) : (
              <div key={idx} className="opacity-70">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
