import { Reveal } from '@/components/reveal';
import { CtaBand } from '@/components/ui/cta-band';
import { ROLE_META, TRADE_PORTAL } from '@/lib/site';
import type { RoleSolutionContent } from '@/lib/solutions-content';

type RoleSolutionProps = {
  content: RoleSolutionContent;
};

export function RoleSolution({ content }: RoleSolutionProps) {
  const roleLabel = ROLE_META[content.role].label;

  return (
    <>
      <section className="border-b border-line py-24">
        <div className="container-site grid gap-14 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">{`What ${roleLabel} do`}</p>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Core responsibilities
            </h2>
            <ul className="mt-6 space-y-4">
              {content.responsibilities.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-iris-cyan" aria-hidden="true" />
                  <p className="text-base leading-relaxed text-muted">{item}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={100}>
            <p className="eyebrow">Dashboard overview</p>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              What you see the moment you sign in
            </h2>
            <div className="glass-panel mt-6 divide-y divide-line">
              {content.dashboard.map((item) => (
                <div key={item} className="flex items-center gap-3 p-4">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-cyan" aria-hidden="true" />
                  <p className="text-sm text-muted">{item}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-line bg-surface py-24">
        <div className="container-site">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Key capabilities</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Built specifically for how {roleLabel.toLowerCase()} work.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {content.capabilities.map((capability, index) => (
              <Reveal key={capability.title} delay={index * 70}>
                <div className="card h-full">
                  <h3 className="text-base font-semibold text-foreground">{capability.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{capability.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line py-24">
        <div className="container-site">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Workflow</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              How {roleLabel.toLowerCase()} move through a trade.
            </h2>
          </Reveal>
          <ol className="mt-14 grid gap-6 lg:grid-cols-4">
            {content.workflow.map((step, index) => (
              <Reveal key={step.title} delay={index * 70}>
                <li className="card h-full">
                  <span className="font-mono text-xs text-muted-2">{`Step ${index + 1}`}</span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-line bg-surface py-24">
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">Benefits</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Why {roleLabel.toLowerCase()} choose Baalvion.
            </h2>
            <ul className="mt-8 space-y-4">
              {content.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <span className="mt-1.5 text-cyan" aria-hidden="true">
                    &#10003;
                  </span>
                  <p className="text-base leading-relaxed text-muted">{benefit}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={100}>
            <p className="eyebrow">{content.useCasesLabel}</p>
            <div className="mt-6 space-y-4">
              {content.useCases.map((useCase) => (
                <div key={useCase.title} className="glass-panel p-5">
                  <h3 className="text-sm font-semibold text-foreground">{useCase.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{useCase.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        eyebrow={ROLE_META[content.role].label}
        title={`Ready to work as a ${ROLE_META[content.role].short.toLowerCase()} on Baalvion?`}
        description="Existing users can sign in directly. New to Baalvion? Contact our team to get your organization onboarded."
        primaryLabel={ROLE_META[content.role].loginLabel}
        primaryHref={TRADE_PORTAL.login}
      />
    </>
  );
}
