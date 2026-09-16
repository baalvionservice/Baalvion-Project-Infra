import { Link } from "react-router";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; to?: string };

// Left-aligned title block with a breadcrumb and an optional fact row — not a centred hero.
export default function PageHeader({ eyebrow, title, lede, crumbs, facts }: {
  eyebrow?: string;
  title: string;
  lede?: string;
  crumbs?: Crumb[];
  facts?: { label: string; value: string }[];
}) {
  return (
    <div className="border-b border-border bg-secondary/40">
      <div className="container mx-auto px-4 py-8 lg:py-10 max-w-6xl">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-xs text-muted-foreground mb-4">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 opacity-50" />}
                {c.to ? <Link to={c.to} className="hover:text-primary hover:underline">{c.label}</Link> : <span className="text-foreground">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <div className="label-eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-3xl lg:text-[40px] font-semibold leading-[1.1]">{title}</h1>
        {lede && <p className="mt-3 text-base text-muted-foreground max-w-2xl leading-relaxed">{lede}</p>}
        {facts && facts.length > 0 && (
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="label-eyebrow">{f.label}</dt>
                <dd className="text-lg font-semibold mt-0.5 tabular-nums">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
