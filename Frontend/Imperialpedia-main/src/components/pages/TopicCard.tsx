import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-900"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-colors group-hover:bg-gray-900 group-hover:text-white">
          <Icon className="h-4.5 w-4.5" />
        </span>
        {count > 0 && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {count} guide{count === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">{label}</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-foreground group-hover:underline">
        Explore
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}
