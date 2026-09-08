
import { ButtonLink, Card, CardBody, CardTitle, Container } from '@/components/ui';
import { SITE } from '@/lib/site';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Welcome');

/**
 * Where a new account lands.
 *
 * It sets expectations rather than selling: what this place is, what it will not do, and
 * what happens next. A person arriving here is usually in the middle of something difficult,
 * and the most useful thing to be is precise.
 */
const PRINCIPLES = [
  {
    title: 'Nobody has to take part',
    body: 'You choose who to involve, and they choose whether to accept. Nobody is added to a case, and nobody is obliged to answer. An invitation that is declined is final.',
  },
  {
    title: 'You control who can see your case',
    body: 'Every case starts private — visible to nobody but you. You decide if and when to widen it, and you can narrow it again or delete it at any point.',
  },
  {
    title: 'Support is offered, never imposed',
    body: 'Members can offer to stand with you. An offer waits for your answer, and you can withdraw an acceptance later. The same is true in reverse.',
  },
  {
    title: 'Nobody may be threatened or targeted',
    body: 'This is not a place to pressure, expose or confront anyone — including the people who oppose your relationship. Accounts used that way are removed.',
  },
  {
    title: 'Respectful disagreement is welcome',
    body: 'People will not always agree with your choices, and saying so kindly is allowed. Contempt is not.',
  },
];

const NEXT_STEPS = [
  { title: 'Set up your profile', body: 'Optional, and undiscoverable until you say otherwise.', href: '/settings', cta: 'Open settings' },
  { title: 'Write down what is happening', body: 'A private draft is a complete first step. Nothing is shared until you share it.', href: '/create-case', cta: 'Start a case' },
  { title: 'See what is already here', body: 'Cases people have chosen to share, and communities you can ask to join.', href: '/cases', cta: 'Explore' },
];

export default function WelcomePage() {
  return (
    <>
      <section className="border-b border-line bg-surface">
        <Container className="py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-accent-strong">Welcome to {SITE.name}</p>
            <h1 className="heading mt-3 text-3xl leading-tight sm:text-4xl">
              A place to think it through, with people who understand it.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              {SITE.name} is a community-support platform. You can set out your situation, find
              voluntary support, take part in respectful discussion, and reach mediation,
              counselling and legal information.
            </p>
            {/* Said plainly and early. A platform about family opposition that implied it could
                deliver an outcome would be selling false hope to people who cannot afford it. */}
            <p className="mt-4 text-ui leading-relaxed text-muted">
              What it cannot do is change anyone&rsquo;s mind for you, or promise that your
              situation will end the way you want. No platform can. What it can offer is people
              who have been somewhere similar, and a way to reach the professionals who help
              with this for a living.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <h2 className="heading text-2xl">How people are expected to behave here</h2>
        <p className="mt-2 max-w-2xl text-muted">
          These are not aspirations. They are enforced by how the software works and by the
          moderators who read reports.
        </p>

        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <li key={p.title}>
              <Card className="h-full">
                <CardBody>
                  <CardTitle as="h3" className="text-base">{p.title}</CardTitle>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mt-14">
          <h2 className="heading text-2xl">Where to start</h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-3">
            {NEXT_STEPS.map((s) => (
              <li key={s.title}>
                <Card className="flex h-full flex-col">
                  <CardBody className="flex h-full flex-col">
                    <CardTitle as="h3" className="text-base">{s.title}</CardTitle>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                    <div className="mt-auto pt-5">
                      <ButtonLink href={s.href} variant="secondary" size="sm">{s.cta}</ButtonLink>
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </div>

        <Card className="mt-12">
          <CardBody>
            <CardTitle as="h2" className="text-base">If a situation is not safe</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {SITE.name} cannot respond quickly and does not watch cases in real time. If you or
              anyone else is in immediate danger, contact your local emergency number. The safety
              section of the resource directory lists organisations that can help.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href="/safety" variant="secondary" size="sm">Read our safety guidance</ButtonLink>
              <ButtonLink href="/resources?category=SAFETY" variant="ghost" size="sm">Safety resources</ButtonLink>
            </div>
          </CardBody>
        </Card>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/create-case" size="lg">Start a case</ButtonLink>
          <ButtonLink href="/cases" variant="secondary" size="lg">Look around first</ButtonLink>
        </div>
      </Container>
    </>
  );
}