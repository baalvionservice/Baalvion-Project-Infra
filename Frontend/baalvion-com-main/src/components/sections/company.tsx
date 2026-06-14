import { SectionShell } from '@/components/structure/section-shell';
import { Reveal } from '@/components/reveal';
import { COMPANY } from '@/lib/content';

export function Company() {
  return (
    <SectionShell
      id="company"
      folio={COMPANY.folio}
      label={COMPANY.label}
      ghost={COMPANY.ghost}
      labelledBy="company-heading"
      pad="section"
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          <Reveal>
            <h2 id="company-heading" className="running-head">
              {COMPANY.headline}
            </h2>
          </Reveal>
        </div>
        <div className="space-y-6 lg:col-span-7 lg:pt-1">
          {COMPANY.paragraphs.map((paragraph, i) => (
            <Reveal key={paragraph.slice(0, 24)} delay={i * 120}>
              <p className="body-lg">{paragraph}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
