import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Maps topic slugs to distinct Tailwind color classes for icon backgrounds. */
const SLUG_COLORS: Record<string, { bg: string; text: string }> = {
  savings:            { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
  checking:           { bg: "bg-blue-50 dark:bg-blue-900/30",    text: "text-blue-600 dark:text-blue-400" },
  "credit-cards":     { bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
  loans:              { bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400" },
  mortgages:          { bg: "bg-rose-50 dark:bg-rose-900/30",    text: "text-rose-600 dark:text-rose-400" },
  "auto-loans":       { bg: "bg-yellow-50 dark:bg-yellow-900/30",text: "text-yellow-600 dark:text-yellow-500" },
  "student-loans":    { bg: "bg-indigo-50 dark:bg-indigo-900/30",text: "text-indigo-600 dark:text-indigo-400" },
  "cd-rates":         { bg: "bg-teal-50 dark:bg-teal-900/30",    text: "text-teal-600 dark:text-teal-400" },
  "money-market":     { bg: "bg-cyan-50 dark:bg-cyan-900/30",    text: "text-cyan-600 dark:text-cyan-400" },
  "banking-reviews":  { bg: "bg-amber-50 dark:bg-amber-900/30",  text: "text-amber-600 dark:text-amber-400" },
};

const DEFAULT_COLOR = { bg: "bg-gray-50 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400" };

type Props = {
  href: string;
  label: string;
  description: string;
  /** Real published/fallback article count for this topic — never a fabricated number. */
  count: number;
  icon: React.ComponentType<{ className?: string }>;
};

/** Dashboard/quick-access card for a single topic — shared by the Banking and
 * Personal Finance hubs (and any future category hub with a topic grid). */
export function TopicCard({ href, label, description, count, icon: Icon }: Props) {
  const slug = href.replace(/^\//, "");
  const color = SLUG_COLORS[slug] ?? DEFAULT_COLOR;

  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30"
    >
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color.bg} transition-colors group-hover:scale-110 duration-200`}>
          <Icon className={`h-5 w-5 ${color.text}`} />
        </span>
        {count > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {count}+
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">{label}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        Explore
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

