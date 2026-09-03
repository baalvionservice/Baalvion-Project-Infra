import { IndianRupee, HeartPulse, GraduationCap, CalendarDays, Home } from 'lucide-react';

/**
 * Benefits, as a full-bleed black band.
 *
 * The reference page ends its posting with `.ajd_rewards{background-color:#000000}` —
 * white headings, a flex row of items, each title bold 20px. It is the one heavy block
 * on an otherwise white page, and it is what stops a long job description trailing off
 * into the footer.
 *
 * The five headings mirror theirs (financial, pay for performance, physical, emotional,
 * life management) because that grouping is a sensible one — but the wording under each
 * describes what Baalvion actually offers, not what they offer.
 */
const BENEFITS = [
  {
    icon: IndianRupee,
    title: 'Financial well-being',
    body: 'Provident fund and gratuity as standard, group life and accident cover, and pay reviewed annually against the band for your level.',
  },
  {
    icon: HeartPulse,
    title: 'Health cover',
    body: 'Family medical insurance including parents, an annual health check, and on-site occupational health at the mine and plant sites.',
  },
  {
    icon: GraduationCap,
    title: 'Learning',
    body: 'A yearly learning budget you choose how to spend, certification support, and sponsorship for the statutory tickets mining roles require.',
  },
  {
    icon: CalendarDays,
    title: 'Time off',
    body: 'Earned leave, casual and sick leave, public holidays by state, and parental leave for both parents.',
  },
  {
    icon: Home,
    title: 'Where you work',
    body: 'Remote-first where the work allows. At site-based operations, transport, canteen and township housing where they apply.',
  },
];

export function JobBenefitsBlock({ id }: { id: string }) {
  return (
    <section id={id} className="scroll-mt-20 bg-black text-white">
      <div className="container mx-auto max-w-[1240px] px-5 py-16 lg:py-[70px]">
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Benefits</h2>
        <p className="mt-3 max-w-2xl text-white/70">
          The same for every role, at every level — a haul truck driver and a staff engineer
          get the same cover.
        </p>

        <ul className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <li key={benefit.title}>
                <Icon className="h-5 w-5 text-brand-yellow" aria-hidden />
                <h3 className="mt-3 text-xl font-bold leading-tight text-white">{benefit.title}</h3>
                <p className="mt-2 leading-relaxed text-white/70">{benefit.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
