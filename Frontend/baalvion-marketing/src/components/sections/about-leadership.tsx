import { Reveal } from '@/components/reveal';

/** Placeholder leadership entries — replace with confirmed names, titles, and headshots. */
const LEADERSHIP = [
  { name: 'Leadership placeholder', title: 'Chief Executive Officer' },
  { name: 'Leadership placeholder', title: 'Chief Operating Officer' },
  { name: 'Leadership placeholder', title: 'Chief Technology Officer' },
  { name: 'Leadership placeholder', title: 'Head of Trade Operations' },
];

/** Placeholder milestones — replace with confirmed dates and outcomes. */
const MILESTONES = [
  { year: 'Milestone 1', body: 'Baalvion founded to bring structure to fragmented trade workflows.' },
  { year: 'Milestone 2', body: 'First trade operations platform released to early design partners.' },
  { year: 'Milestone 3', body: 'Role-based workflow launched for buyers, sellers, and trade agents.' },
  { year: 'Milestone 4', body: 'Platform expands to support cross-border compliance and logistics.' },
];

export function AboutLeadership() {
  return (
    <section className="border-b border-line bg-surface py-24">
      <div className="container-site">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Leadership</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            The team steering Baalvion forward.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted">
            Names and roles below are placeholders pending final leadership bios and photography.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LEADERSHIP.map((leader) => (
            <div key={leader.title} className="card text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-iris-cyan" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-foreground">{leader.name}</p>
              <p className="mt-1 text-xs text-muted-2">{leader.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container-site mt-20">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Milestones</p>
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            Where we&rsquo;ve been, and where we&rsquo;re headed.
          </h3>
        </Reveal>
        <ol className="mt-10 space-y-6 border-l border-line pl-8">
          {MILESTONES.map((milestone) => (
            <li key={milestone.year} className="relative">
              <span
                className="absolute -left-[2.35rem] top-1 h-3 w-3 rounded-full bg-iris-cyan"
                aria-hidden="true"
              />
              <p className="eyebrow">{milestone.year}</p>
              <p className="mt-2 text-base leading-relaxed text-muted">{milestone.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
