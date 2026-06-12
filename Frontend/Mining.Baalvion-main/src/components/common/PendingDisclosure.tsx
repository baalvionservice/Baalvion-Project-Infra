import { Info, FileQuestion } from "lucide-react";
import Link from "next/link";

/**
 * Honest placeholder for any data area awaiting real company input.
 * Renders "Information pending company disclosure." — never fabricated data.
 */
export function PendingDisclosure({
  label = "Information pending company disclosure.",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-4 text-slate-500 ${className}`}
      role="note"
    >
      <Info className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" aria-hidden="true" />
      <p className="text-sm leading-relaxed">{label}</p>
    </div>
  );
}

/**
 * Empty-state for list sections (no projects/tenders/news yet). Honest, with an
 * optional CTA — never invents items to fill the space.
 */
export function EmptyState({
  title,
  message,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  message: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <FileQuestion className="h-7 w-7 text-slate-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-slate-700">{title}</h3>
      <p className="max-w-md text-sm text-slate-500 leading-relaxed">{message}</p>
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="mt-2 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
