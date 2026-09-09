import { publicMetadata } from '@/lib/seo';
import { ButtonLink, Card, CardBody, Container, Section, VisibilityBadge } from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';

export const metadata = publicMetadata({
  title: 'How it works',
  description: 'What a case is, who can see it, and what has to happen before anyone else takes part.',
  path: '/how-it-works',
});

const STEPS = [
  {
    title: 'Write down what is happening',
    body: 'A case is your own account of your situation. It is saved as a private draft — visible to nobody, not even a moderator — and stays that way until you decide otherwise.',
  },
  {
    title: 'Choose who can see it',
    body: 'Keep it private, or share it with one community you belong to. The setting is shown on the case itself so you can always check it, and you can change or narrow it at any time.',
  },
  {
    title: 'Find voluntary support',
    body: 'Members can offer to stand with you. An offer is a request that waits for your answer — nobody joins your case by pressing a button, and you can remove a supporter later.',
  },
  {
    title: 'Have respectful conversations',
    body: 'The people taking part can talk it through with you. What helps most is usually what actually happened when somebody tried something, rather than instructions about what you should do.',
  },
  {
    title: 'Reach real help when you need it',
    body: 'The resource directory lists mediation services, counselling, legal information and safety planning — added and checked by volunteers, not generated.',
  },
];

const VISIBILITY_LEVELS = [
  {
    level: 'PRIVATE' as const,
    who: 'You, and anyone you invited who accepted',
    note: 'Where every case starts. It does not appear in any list, search or count for anyone else.',
  },
  {
    level: 'COMMUNITY' as const,
    who: 'Active members of the one community you choose',
    note: 'You have to belong to that community yourself. Members see your summary — the fuller story stays with the people taking part.',
  },
  {
    level: 'PUBLIC' as const,
    who: 'Anyone who visits the site',
    note: 'Only the summary you wrote — never the detail, and never who else is involved. Not indexed by search engines, and turned off entirely where there is no moderation cover.',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="How it works"
        lead="Five steps, each of which you control. Nothing happens to your case that you did not choose."
      />

      <Container className="py-section">
        <Section title="The path through" description="You can stop at any step. Writing it down privately is a complete first step on its own.">
          <ol className="relative space-y-5 border-l border-line pl-6 sm:pl-8">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative">
                {/* The numeral is the marker; the border above is the thread between steps. */}
                <span
                  aria-hidden="true"
                  className="absolute -left-[2.1rem] flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface font-display text-sm font-semibold text-accent-strong sm:-left-[2.6rem]"
                >
                  {i + 1}
                </span>
                <h3 className="heading text-base">{step.title}</h3>
                <p className="mt-1.5 max-w-2xl text-ui leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section className="mt-section-lg" title="Who can see a case" description="Shown on every case, so you can check it at a glance.">
          <div className="grid gap-4 md:grid-cols-3">
            {VISIBILITY_LEVELS.map((v) => (
              <Card key={v.level} className="h-full">
                <CardBody>
                  <VisibilityBadge visibility={v.level} />
                  <h3 className="heading mt-3 text-base">{v.who}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{v.note}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </Section>

        <Section className="mt-section-lg" title="Inviting someone into a case">
          <div className="max-w-2xl space-y-4 text-body leading-relaxed">
            <p>
              You can invite your partner, a family member, a mediator or an adviser by creating a
              code and sending it to them yourself. Two things are always true of an invitation:
            </p>
            <ul className="space-y-3 text-muted">
              <li className="flex gap-3">
                <span aria-hidden="true" className="mt-1.5 text-accent">—</span>
                <span>
                  <span className="text-foreground">Only they can answer it.</span> Not you, not a
                  moderator, not an administrator. There is no override anywhere in the system.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="mt-1.5 text-accent">—</span>
                <span>
                  <span className="text-foreground">We never learn who they are.</span> A code names
                  a relationship, not a person — there is no field for a name, an email or a phone
                  number, so there is nothing about them for us to hold or to leak.
                </span>
              </li>
            </ul>
            <p className="text-muted">
              Anyone who accepts can withdraw later, and withdrawing takes effect immediately.
            </p>
          </div>
        </Section>

        <Section className="mt-section-lg" title="What this platform cannot do">
          <div className="max-w-2xl space-y-4 text-body leading-relaxed text-muted">
            <p>
              It cannot change anyone&rsquo;s mind for you, and it will not promise that your
              situation ends the way you want. No platform can do either, and one that implied
              otherwise would be selling false hope to people who cannot afford it.
            </p>
            <p>
              It is also not a way to pressure, expose or confront anyone — including the people
              who oppose your relationship — and an account used that way is removed.
            </p>
          </div>
        </Section>

        <div className="mt-section-lg flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/create-case" size="lg">Get support</ButtonLink>
          <ButtonLink href="/safety" variant="secondary" size="lg">Read our safety guidance</ButtonLink>
        </div>
      </Container>
    </>
  );
}
