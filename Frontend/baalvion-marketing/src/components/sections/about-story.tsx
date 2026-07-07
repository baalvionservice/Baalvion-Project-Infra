import { Reveal } from '@/components/reveal';

const VALUES = [
  {
    title: 'Transparency first',
    body: 'Every party in a trade should see the same facts at the same time. We design against hidden state, not around it.',
  },
  {
    title: 'Accountability by design',
    body: 'Actions are attributed and timestamped by default. Trust is built on evidence, not assurances.',
  },
  {
    title: 'Efficiency without shortcuts',
    body: 'We automate the repetitive parts of trade so people can spend their judgment where it actually matters.',
  },
  {
    title: 'Built for the long haul',
    body: 'Trade relationships span years, not sessions. We build for durability, not demo-day polish.',
  },
];

export function AboutStory() {
  return (
    <section className="border-b border-line py-24">
      <div className="container-site grid gap-16 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow">Our story</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Baalvion started with a simple observation.
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
            <p>
              Global trade runs on relationships — but those relationships are held together by
              email threads, shared spreadsheets, and a lot of manual follow-up. A requirement
              gets raised in one tool, negotiated over a call, confirmed in an inbox, and tracked
              in a document that only one person keeps up to date.
            </p>
            <p>
              That fragmentation isn&rsquo;t a minor inconvenience. It&rsquo;s where deals slow
              down, terms get misremembered, and accountability quietly disappears. We built
              Baalvion because trade deserves an operating layer as serious as the transactions
              running through it.
            </p>
            <p>
              Today, Baalvion brings buyers, sellers, and trade agents into one workflow — so the
              record of a trade is the trade, not a reconstruction of it after the fact.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="glass-panel p-8">
            <p className="eyebrow">Mission</p>
            <p className="mt-4 text-lg font-medium leading-relaxed text-foreground">
              Give every party in a trade the same clear view of what was agreed, what&rsquo;s in
              progress, and what happens next.
            </p>
            <div className="my-8 border-t border-line" />
            <p className="eyebrow">Vision</p>
            <p className="mt-4 text-lg font-medium leading-relaxed text-foreground">
              A global trade ecosystem where procurement runs on structured, shared workflows —
              not fragmented tools and unverified trust.
            </p>
          </div>
        </Reveal>
      </div>

      <div className="container-site mt-20">
        <Reveal>
          <p className="eyebrow">Core values</p>
          <h3 className="mt-5 max-w-xl text-2xl font-semibold tracking-tight text-foreground">
            The principles behind every product decision we make.
          </h3>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {VALUES.map((value, index) => (
            <Reveal key={value.title} delay={index * 70}>
              <div className="card h-full">
                <h4 className="text-base font-semibold text-foreground">{value.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted">{value.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
