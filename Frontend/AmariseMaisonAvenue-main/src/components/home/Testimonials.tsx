import { Quote } from "lucide-react";
import type { HomepageTestimonial } from "@/lib/cms";

interface TestimonialsProps {
  testimonials: HomepageTestimonial[];
}

/** Client voices — social proof, fully admin-editable. */
export function Testimonials({ testimonials }: TestimonialsProps) {
  if (!testimonials.length) return null;

  return (
    <section className="container mx-auto px-6 py-24">
      <div className="mb-14 flex flex-col items-center space-y-3 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-plum">
          In the Words of Our Clients
        </span>
        <h2 className="font-headline text-4xl font-bold italic text-gray-900 md:text-5xl">
          A Century of Trust
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {testimonials.map((t, idx) => (
          <figure
            key={idx}
            className="flex flex-col gap-6 border border-border bg-white p-10 transition-shadow duration-500 hover:shadow-luxury"
          >
            <Quote className="h-8 w-8 text-gold/50" />
            <blockquote className="flex-1 text-lg font-light italic leading-relaxed text-gray-700">
              “{t.quote}”
            </blockquote>
            <figcaption className="space-y-0.5">
              <p className="font-headline text-base font-bold text-gray-900">
                {t.author}
              </p>
              {t.location && (
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400">
                  {t.location}
                </p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
