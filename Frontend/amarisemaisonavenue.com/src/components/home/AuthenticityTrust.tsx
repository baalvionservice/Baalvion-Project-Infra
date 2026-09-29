import { ShieldCheck, Check } from "lucide-react";
import type { HomepageTrust } from "@/lib/cms";

interface AuthenticityTrustProps {
  trust: HomepageTrust;
}

/** The 100% authenticity / trust band — badge, narrative and guarantee points. */
export function AuthenticityTrust({ trust }: AuthenticityTrustProps) {
  if (!trust.title && !trust.points.length) return null;

  return (
    <section className="bg-plum/5 py-24 border-y border-border">
      <div className="container mx-auto grid grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
        <div className="space-y-7">
          {trust.badge && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-plum shadow-sm">
              <ShieldCheck className="h-4 w-4 text-gold" />
              {trust.badge}
            </span>
          )}
          <h2 className="font-headline text-4xl font-bold italic leading-tight text-gray-900 md:text-5xl">
            {trust.title}
          </h2>
          {trust.body && (
            <p className="max-w-xl text-base font-light leading-relaxed text-gray-600">
              {trust.body}
            </p>
          )}
        </div>

        {trust.points.length > 0 && (
          <ul className="space-y-5">
            {trust.points.map((point, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-gold shadow-sm">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span className="text-[15px] font-light leading-relaxed text-gray-700">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
