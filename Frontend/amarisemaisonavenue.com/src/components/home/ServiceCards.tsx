import Link from "next/link";
import {
  ShieldCheck,
  Repeat,
  Crown,
  Gem,
  Sparkles,
  Award,
  BadgeCheck,
  Handshake,
  Truck,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import type { HomepageService } from "@/lib/cms";

interface ServiceCardsProps {
  services: HomepageService[];
  countryCode: string;
}

// Admin chooses an icon by name; we map the known set, defaulting to Sparkles.
const ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  Repeat,
  Crown,
  Gem,
  Sparkles,
  Award,
  BadgeCheck,
  Handshake,
  Truck,
  Headphones,
};

/** Three trust/service cards (authenticity · sell & consign · concierge). */
export function ServiceCards({ services, countryCode }: ServiceCardsProps) {
  if (!services.length) return null;
  const href = (path: string) =>
    path.startsWith("/") ? `/${countryCode}${path}` : path;

  return (
    <section className="border-b border-border bg-white">
      <div className="container mx-auto grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {services.map((service, idx) => {
          const Icon = ICONS[service.icon] ?? Sparkles;
          return (
            <Link
              key={idx}
              href={href(service.href)}
              className="group flex flex-col items-center gap-4 px-8 py-14 text-center transition-colors hover:bg-ivory"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-plum/5 text-gold transition-colors group-hover:bg-plum/10">
                <Icon className="h-7 w-7" strokeWidth={1.4} />
              </span>
              <h3 className="font-headline text-xl font-bold italic text-gray-900">
                {service.title}
              </h3>
              <p className="max-w-xs text-[13px] font-light leading-relaxed text-gray-500">
                {service.body}
              </p>
              <span className="mt-1 border-b border-gold pb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-plum transition-colors group-hover:text-gold">
                {service.ctaLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
