import { Reveal } from '@/components/reveal';

/**
 * Placeholder quotes — replace with verified customer testimonials
 * (name, title, and company confirmed for public use) before launch.
 */
const TESTIMONIALS = [
  {
    quote:
      'We used to lose a day every week reconciling order status across email and spreadsheets. Now every party sees the same record in real time.',
    name: 'Procurement Lead',
    role: 'Placeholder — Manufacturing Buyer',
  },
  {
    quote:
      'Being matched to live requirements instead of chasing cold leads changed how we plan capacity for the quarter.',
    name: 'Export Manager',
    role: 'Placeholder — Regional Seller',
  },
  {
    quote:
      'Coordinating buyers and sellers used to mean being the human API between two inboxes. Now approvals and status live in one place.',
    name: 'Trade Operations Agent',
    role: 'Placeholder — Trade Agent Partner',
  },
];

export function Testimonials() {
  return (
    <section className="border-b border-line bg-surface py-24">
      <div className="container-site">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">From the trade floor</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            What running trade on one platform feels like.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal key={testimonial.name} delay={index * 80}>
              <figure className="card flex h-full flex-col justify-between">
                <blockquote className="text-base leading-relaxed text-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 border-t border-line pt-4">
                  <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-2">{testimonial.role}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
