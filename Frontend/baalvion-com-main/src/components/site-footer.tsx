import { FOOTER, SITE } from '@/lib/content';
import { Wordmark } from './wordmark';

/** The colophon — the plinth at the base of the charter. */
export function SiteFooter() {
  return (
    <footer id="footer" className="border-t hairline-strong bg-ink-deep">
      {/* architectural elevation ruler */}
      <div className="ruler-ticks w-full" aria-hidden="true" />

      <div className="site-container grid gap-12 py-16 md:grid-cols-[1.6fr_repeat(4,1fr)] md:py-20">
        <div className="space-y-4">
          <Wordmark className="text-foreground" />
          <p className="max-w-xs text-sm leading-relaxed text-muted">{FOOTER.statement}</p>
        </div>

        {FOOTER.columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="mono-label mb-4">{column.title}</p>
            <ul className="space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground/80 transition-colors duration-200 hover:text-accent active:text-accent-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t hairline">
        <div className="site-container flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono-caption">{FOOTER.charter}</p>
          <p className="mono-caption">© {new Date().getFullYear()} {SITE.name}</p>
        </div>
      </div>
    </footer>
  );
}
