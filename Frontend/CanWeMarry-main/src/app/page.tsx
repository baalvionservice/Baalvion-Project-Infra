import Link from 'next/link';
import Image from 'next/image';
import { ButtonLink, Card, CardBody, CardTitle, Container, Section } from '@/components/ui';
import { SITE, BOUNDARIES } from '@/lib/site';
import { GUIDES, readMinutes } from '@/content/guides';
import { CategoryChip, GuideVisual } from '@/components/guides/guide-visual';
import { publicMetadata, jsonLd } from '@/lib/seo';

/**
 * Photography.
 *
 * All Pexels (free licence, commercial use, no attribution required), stored in /public so
 * `img-src 'self'` already covers them — no CSP change and no remote host.
 *
 * These now include couples and weddings, and that is deliberate. The product is about
 * getting married; a page with no joy in it argues, by accident, that the thing being fought
 * for is not worth much. What stays off the page is different and narrower: no photograph is
 * captioned as a member, quoted as a testimonial, or attached to a case. They illustrate the
 * subject, not the userbase — and the one worked example on this page is labelled as an
 * illustration precisely because inventing somebody's marriage is the line.
 *
 * No single faith owns the page either. The traditions row below carries a Sikh wedding, a
 * Hindu one and a church one at the same size, because the product exists for the couples who
 * are told to pick.
 */
const IMG = {
  couple: { src: '/img/hero-couple.jpg', alt: 'A couple in red and gold wedding dress, laughing together' },
  mehendi: { src: '/img/mehendi.jpg', alt: 'Hands decorated with mehendi, holding a small lamp' },
  colour: { src: '/img/colour.jpg', alt: 'Heaps of brightly coloured festival powder' },
  marigolds: { src: '/img/marigolds.jpg', alt: 'Marigold flowers growing' },
  hands: { src: '/img/hands.jpg', alt: 'Two hands resting together' },
  street: { src: '/img/street.jpg', alt: 'A fabric stall on an Indian street' },
  threshold: { src: '/img/threshold.jpg', alt: 'A carved sandstone doorway in an Indian building' },
} as const;

/**
 * Three weddings.
 *
 * The point of the row is the product's whole reason for existing: these are the ceremonies
 * families tell people they must choose between. Shown together, at the same size, with no
 * caption claiming anyone in them is a member.
 *
 * The alt text describes what is in each photograph and stops there. Naming the tradition —
 * "a Sikh wedding", "a church wedding" — would be asserting the faith of a stranger from
 * their clothes, and the first draft of this got it wrong in exactly that way: the bride in
 * the third photograph is in a white dress and a headscarf, which is not evidence of a
 * church. The heading carries the meaning; the alt text carries the facts.
 */
const TRADITIONS = [
  { src: '/img/tradition-1.jpg', alt: 'A couple sitting together outside a brightly painted house' },
  { src: '/img/tradition-3.jpg', alt: 'A bride in a red wedding sari and gold jewellery' },
  { src: '/img/tradition-2.jpg', alt: 'A bride in a white dress and veil beside her groom' },
] as const;

export const metadata = publicMetadata({
  title: 'Love shouldn’t have to stand alone',
  description: SITE.description,
  path: '/',
});

/**
 * The landing page.
 *
 * Styled like a modern consumer app — a full-bleed hero, large display type, rounded cards
 * with real depth — because the people who arrive here are usually in the middle of
 * something hard, and a page that looks cared for is easier to trust than one that looks
 * like a form.
 *
 * Two things it deliberately does NOT borrow from that genre.
 *
 * No grid of people. A browsable wall of profiles is the pattern this product exists without:
 * it would turn people in a family crisis into something you scroll past. The photographs are
 * of the subject — weddings, mehendi, colour — and none is offered as a member.
 *
 * And nothing frames this as meeting anyone. The words stay what they were: support, consent,
 * privacy. `BOUNDARIES.isNot` — which says in as many words that this is not dating and not
 * matchmaking — keeps its place on the page rather than being softened to suit the styling.
 */

const STEPS = [
  {
    title: 'Write it down, privately',
    body: 'What was said at home. What your parents are afraid of. What you have already tried. It is visible to nobody but you, and it stays that way until you decide otherwise.',
  },
  {
    title: 'Decide who sees it',
    body: 'Keep it to yourself, share it with one community, or open it wider. Anyone you name — a sibling, a cousin, a friend — has to agree before they appear at all.',
  },
  {
    title: 'Take the help you want',
    body: 'People who have had this exact conversation with their own families can offer to stand with you. Every offer waits for your answer, and you can change it later.',
  },
];

const WHY = [
  {
    title: 'The two choices you are offered are both bad',
    body: 'Give up the person, or give up the family. Almost everything written about this assumes you will pick one. Most people are looking for the third thing, and there is very little help for that.',
  },
  {
    title: 'Someone has already had your conversation',
    body: 'A Muslim woman whose parents came round. A Dalit man whose did not. They know which words landed and which made it worse — and that is not in any article.',
  },
  {
    title: 'The law is more on your side than you think',
    body: 'The Special Marriage Act exists. So do mediators, and lawyers who do this every week. Knowing what is actually possible changes the conversation at home.',
  },
];

const CAN_DO = [
  { title: 'Write your case', body: 'Set out what is happening, privately, and decide later who should see it.', href: '/create-case' },
  { title: 'Offer support', body: 'Ask to stand with someone. They decide whether to accept.', href: '/cases' },
  { title: 'Join a community', body: 'Find a group organised around a shared situation or place.', href: '/community' },
  { title: 'Find real help', body: 'Mediation, counselling, Indian marriage law and safety planning.', href: '/resources' },
];

/**
 * The example below is labelled as an illustration, in the copy and in the markup, and
 * describes no real person. Inventing a testimonial for a platform about family conflict
 * would be a fabricated account of somebody's marriage.
 */
const ILLUSTRATION = {
  title: 'What a case tends to look like',
  body: 'Someone writes a few paragraphs about parents who will not meet their partner because he is from another faith. They keep it private at first, invite a sister who agrees to take part, and later open it to one community. Two people whose families came round in the end offer support. A volunteer points them to a mediation service in their city.',
};

export default function HomePage() {
  /*
   * Organization and WebSite.
   *
   * No `aggregateRating`, no `review`, no member counts. Every one of those is a rich-result
   * lever and every one of them would be invented — this platform has no ratings and does not
   * publish how many people use it. A fabricated rating is also the fastest way to lose the
   * trust the rest of the page is asking for.
   *
   * No SearchAction either: site search exists only over content a signed-in member is
   * entitled to see, so advertising a public search endpoint would be describing something
   * that does not exist for a crawler.
   */
  const structured = jsonLd({
    '@graph': [
      {
        '@type': 'Organization',
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        areaServed: 'IN',
      },
      {
        '@type': 'WebSite',
        name: SITE.name,
        url: SITE.url,
        inLanguage: 'en-IN',
      },
    ],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={structured} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b border-line">
        {/* Colour, not photography. Two soft washes of the accent over the warm ground give
            the page depth without asserting that anyone in particular uses it. Marked
            aria-hidden and pointer-events-none: decoration only. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-soft via-ground to-ground" />
          <div className="absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-rose/20 blur-3xl" />
          <div className="absolute -right-24 top-10 h-[30rem] w-[30rem] rounded-full bg-marigold/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-[22rem] w-[22rem] rounded-full bg-saffron/10 blur-3xl" />
        </div>

        <Container className="grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16 lg:py-32">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-1.5 text-sm font-semibold text-white shadow-lift">
              <span aria-hidden="true">♥</span> Inter-faith · Inter-caste · India
            </p>

            {/* No forced break: the hero is two columns from `lg` up, so a hard <br> produced
                a three-line heading with an orphan. `text-balance` lets the browser even the
                lines out at whatever width it ends up with. */}
            <h1 className="heading mt-6 text-balance text-[2.75rem] leading-[1.03] tracking-[-0.02em] sm:text-6xl lg:text-[3.75rem] xl:text-7xl">
              Two people said yes.{' '}
              <span className="text-rose">Everyone else said no.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
              You found each other. Then caste came up, or religion did — Hindu and Muslim, Hindu
              and Christian, one gotra and another — and suddenly the two of you were the smallest
              part of the conversation.
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              CanWeMarry is where people in that situation find each other, think it through, and
              get to mediators, counsellors and lawyers who actually know Indian family law.{' '}
              <span className="font-medium text-foreground">
                The problem was never the two of you.
              </span>
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href="/create-case"
                size="lg"
                className="rounded-full border-transparent bg-rose px-8 text-white shadow-lift hover:bg-rose-deep"
              >
                Start your story
              </ButtonLink>
              <ButtonLink href="/cases" variant="secondary" size="lg" className="rounded-full px-8">
                See who else is here
              </ButtonLink>
            </div>

            {/* The safety answer, in the hero rather than three screens down. It is the
                question a person in this situation asks before any other. */}
            <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted-2">
              Everything you write starts private — visible to nobody, not even a moderator — and
              only you decide if that changes. Nothing here is indexed by search engines.{' '}
              <Link href="/how-it-works" className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-4">
                How it works
              </Link>
              {' · '}
              <Link href="/safety" className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-4">
                Trust and safety
              </Link>
            </p>
          </div>

          {/*
            The visual half of the hero: a photograph, and the privacy model overlapping it.

            The photograph is the reason anyone is here — two people who want the wedding. The
            card is the reason they can trust the page with it, and it describes real behaviour
            rather than decorating: a case genuinely does start private and genuinely does not
            move without its author. Marked aria-hidden because the same three facts are stated
            in words directly beneath it, and a screen reader should hear them once.
          */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            {/* Priority: it is the largest thing above the fold, and lazy-loading it would
                leave a hole on first paint. */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-line shadow-lift sm:aspect-[5/4] lg:aspect-[4/5]">
              <Image
                src={IMG.couple.src}
                alt={IMG.couple.alt}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 90vw"
                className="object-cover"
              />
            </div>

            <div
              aria-hidden="true"
              className="relative z-10 -mt-16 ml-4 mr-4 rounded-[1.5rem] border border-line bg-ground/90 p-6 shadow-lift backdrop-blur-md sm:ml-8 sm:mr-8"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-2">Who can see your case</p>

              <ul className="mt-5 space-y-3">
                {[
                  { label: 'Private', note: 'Only you', now: true },
                  { label: 'One community', note: 'If you choose', now: false },
                  { label: 'Wider', note: 'If you choose', now: false },
                ].map((state) => (
                  <li
                    key={state.label}
                    className={
                      state.now
                        ? 'flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent-soft px-4 py-3.5'
                        : 'flex items-center gap-3 rounded-2xl border border-line px-4 py-3.5'
                    }
                  >
                    <span
                      className={
                        state.now
                          ? 'h-2.5 w-2.5 shrink-0 rounded-full bg-accent'
                          : 'h-2.5 w-2.5 shrink-0 rounded-full border border-line-strong'
                      }
                    />
                    <span className={state.now ? 'font-medium text-foreground' : 'text-muted'}>{state.label}</span>
                    <span className="ml-auto text-sm text-muted-2">{state.note}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-muted">
                Every case starts at the top. Nothing moves down that list unless you move it.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Three traditions ─────────────────────────────────────────────── */}
      <section className="border-b border-line bg-gradient-to-b from-rose-soft/60 to-ground">
        <Container className="py-section sm:py-section-lg">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="heading text-balance text-3xl tracking-[-0.01em] sm:text-4xl">
              Three weddings. <span className="text-rose">One question.</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Nobody in these photographs chose the family they were born into. That is the only
              thing standing between a lot of people and the day they actually want.
            </p>
          </div>

          <ul className="mt-12 grid gap-4 sm:grid-cols-3">
            {TRADITIONS.map((t) => (
              <li
                key={t.src}
                className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] border border-line shadow-lift"
              >
                <Image
                  src={t.src}
                  alt={t.alt}
                  fill
                  sizes="(min-width: 640px) 30vw, 92vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>

          {/* Said plainly, because the row of photographs could otherwise be read as a claim
              that these are people who use the service. They are not. */}
          <p className="mt-6 text-center text-sm text-muted-2">
            Photographs are illustrative. Nobody shown here is a member of CanWeMarry.
          </p>
        </Container>
      </section>

      {/* ── Guides ───────────────────────────────────────────────────────── */}
      {/* Placed this high on purpose. The question somebody arrives with at two in the
          morning is usually "are we even allowed to do this", and the answer is yes — so it
          should not be four screens down behind an explanation of the product. */}
      <Container className="py-section sm:py-section-lg">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="heading text-3xl tracking-[-0.01em] sm:text-4xl">Start by knowing where you stand</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted">
              You are almost certainly allowed to marry. Most people are told otherwise by people
              who have never read the Act.
            </p>
          </div>
          <Link
            href="/guides"
            className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-4"
          >
            All guides
          </Link>
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {GUIDES.slice(0, 3).map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="focus-ring group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-line bg-ground transition-shadow hover:shadow-lift"
              >
                <GuideVisual guide={g} sizes="(min-width: 768px) 24rem, 92vw" className="aspect-[16/10]" />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <CategoryChip category={g.category} />
                    <span className="text-sm text-muted-2">{readMinutes(g)} min read</span>
                  </div>
                  <h3 className="heading mt-4 text-balance text-xl leading-snug transition-colors group-hover:text-rose">
                    {g.title}
                  </h3>
                  <p className="mt-2.5 text-ui leading-relaxed text-muted">{g.excerpt}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <Container className="py-section sm:py-section-lg">
        <Section title="How it works" description="Three steps, each of which you control.">
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <Card className="h-full rounded-3xl transition-shadow hover:shadow-lift">
                  <CardBody className="p-7">
                    {/* A large numeral rather than a label: it reads as a sequence at a
                        glance, which is what somebody skimming needs. */}
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marigold font-display text-lg font-semibold text-white shadow-lift"
                    >
                      {i + 1}
                    </span>
                    <CardTitle className="mt-5 text-lg">
                      <span className="sr-only">Step {i + 1}: </span>
                      {step.title}
                    </CardTitle>
                    <p className="mt-2.5 text-ui leading-relaxed text-muted">{step.body}</p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ol>
        </Section>
      </Container>

      {/* ── Why community support matters ────────────────────────────────── */}
      <section className="border-y border-line bg-surface">
        <Container className="py-section sm:py-section-lg">
          <Section title="Why community support matters">
            <div className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center">
              <div className="relative aspect-[5/3] overflow-hidden rounded-[1.5rem] border border-line lg:aspect-[4/3]">
                <Image
                  src={IMG.mehendi.src}
                  alt={IMG.mehendi.alt}
                  fill
                  sizes="(min-width: 1024px) 38vw, 92vw"
                  className="object-cover"
                />
              </div>
              <p className="text-balance text-xl leading-relaxed text-muted sm:text-2xl">
                Every family in India knows how to put on a wedding. Far fewer know what to do
                when the two people involved come from different sides of a line somebody else
                drew.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {WHY.map((w) => (
                <div key={w.title}>
                  <span aria-hidden="true" className="block h-1 w-12 rounded-full bg-rose" />
                  <h3 className="heading mt-5 text-lg">{w.title}</h3>
                  <p className="mt-2.5 text-ui leading-relaxed text-muted">{w.body}</p>
                </div>
              ))}
            </div>
          </Section>
        </Container>
      </section>

      {/* ── What people can do ───────────────────────────────────────────── */}
      <Container className="py-section sm:py-section-lg">
        <Section title="What you can do here">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAN_DO.map((c) => (
              <li key={c.title}>
                <Card href={c.href} className="group h-full rounded-3xl transition-shadow hover:shadow-lift">
                  <CardBody className="p-7">
                    <CardTitle className="text-lg">{c.title}</CardTitle>
                    <p className="mt-2.5 text-ui leading-relaxed text-muted">{c.body}</p>
                    <span
                      aria-hidden="true"
                      className="mt-5 inline-block font-medium text-accent-strong transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      </Container>

      {/* ── Safety and privacy ───────────────────────────────────────────── */}
      <section id="safety" className="border-y border-line bg-surface">
        <Container className="py-section sm:py-section-lg">
          <Section title="Safety and privacy" description="These are built into how the software works, not just into what we ask people to do.">
            <div className="grid gap-5 md:grid-cols-2">
              <Card className="rounded-3xl">
                <CardBody className="p-7">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-strong">What it is</h3>
                  <ul className="mt-5 space-y-3">
                    {BOUNDARIES.is.map((line) => (
                      <li key={line} className="flex gap-3 text-ui">
                        <span aria-hidden="true" className="mt-1 text-accent">—</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>

              {/* Kept, and given equal visual weight. This is the list that says the product
                  is not dating and not matchmaking, and somebody arriving in a crisis should
                  meet it on the front page rather than discover it later. */}
              <Card className="rounded-3xl">
                <CardBody className="p-7">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">What it is not</h3>
                  <ul className="mt-5 space-y-3">
                    {BOUNDARIES.isNot.map((line) => (
                      <li key={line} className="flex gap-3 text-ui text-muted">
                        <span aria-hidden="true" className="mt-1">—</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </div>

            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted">
              You can invite someone into a case only if they already have an account and can answer
              for themselves. Until they accept, nobody can tell who they are — there is no field
              anywhere in the system for the name or contact details of someone who has not agreed
              to appear.
            </p>
          </Section>
        </Container>
      </section>

      {/* ── Illustration, explicitly labelled ────────────────────────────── */}
      <Container className="py-section sm:py-section-lg">
        <Section title="An illustration" description="Not a real case. We do not publish accounts of people's marriages as marketing.">
          <div className="mb-8 relative aspect-[16/7] max-w-2xl overflow-hidden rounded-[1.5rem] border border-line">
            <Image
              src={IMG.hands.src}
              alt={IMG.hands.alt}
              fill
              sizes="(min-width: 768px) 42rem, 92vw"
              className="object-cover"
            />
          </div>
          <Card className="max-w-2xl rounded-3xl">
            <CardBody className="p-7">
              <p className="inline-flex rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-2">
                Illustrative example
              </p>
              <CardTitle className="mt-4 text-lg">{ILLUSTRATION.title}</CardTitle>
              <p className="mt-2.5 leading-relaxed text-muted">{ILLUSTRATION.body}</p>
            </CardBody>
          </Card>
        </Section>
      </Container>

      {/* ── Resources ────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface">
        <Container className="py-section sm:py-section-lg">
          <Section title="Practical help" description="Added and checked by volunteers, not generated.">
            <p className="max-w-2xl leading-relaxed text-muted">
              The resource directory lists mediation services, counselling, legal information and
              safety planning. Where a category is empty, nothing has been verified for it yet —
              that is not the same as no help existing.
            </p>
            <div className="mt-6">
              <ButtonLink href="/resources" variant="secondary" className="rounded-full px-6">
                Browse resources
              </ButtonLink>
            </div>

            <div className="relative mt-10 aspect-[16/6] overflow-hidden rounded-[1.5rem] border border-line">
              <Image
                src={IMG.colour.src}
                alt={IMG.colour.alt}
                fill
                sizes="92vw"
                className="object-cover"
              />
            </div>
          </Section>
        </Container>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <Container className="py-section sm:py-section-lg">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-line bg-surface px-6 py-16 text-center sm:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-soft to-transparent" />
            <div className="absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-marigold/25 blur-3xl" />
            <div className="absolute -top-20 right-4 h-56 w-56 rounded-full bg-rose/15 blur-3xl" />
          </div>
          <h2 className="heading text-3xl tracking-[-0.01em] sm:text-4xl">Start where you are.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted">
            You do not have to decide anything today. Writing it down privately is a complete first
            step, and nothing you write is shared until you choose to share it.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink
              href="/create-case"
              size="lg"
              className="rounded-full border-transparent bg-rose px-8 text-white shadow-lift hover:bg-rose-deep"
            >
              Start your story
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="secondary" size="lg" className="rounded-full px-8">
              How it works
            </ButtonLink>
          </div>
        </div>
      </Container>
    </>
  );
}
