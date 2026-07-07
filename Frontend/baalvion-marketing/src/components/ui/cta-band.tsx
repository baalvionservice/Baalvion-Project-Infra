import { Reveal } from '@/components/reveal';
import { TRADE_PORTAL } from '@/lib/site';

type CtaBandProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function CtaBand({
  eyebrow = 'Ready when you are',
  title,
  description,
  primaryLabel = 'Sign In',
  primaryHref = TRADE_PORTAL.login,
  secondaryLabel = 'Talk to Sales',
  secondaryHref = '/contact',
}: CtaBandProps) {
  return (
    <section className="relative overflow-hidden border-y border-line bg-surface">
      <div className="absolute inset-0 bg-mesh-hero opacity-60" aria-hidden="true" />
      <div className="container-site relative py-20 text-center">
        <Reveal>
          <p className="eyebrow text-center">{eyebrow}</p>
          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">{description}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={primaryHref} className="btn-primary focus-ring">
              {primaryLabel}
            </a>
            <a href={secondaryHref} className="btn-secondary focus-ring">
              {secondaryLabel}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
