import Link from "next/link";
import { Calculator } from "lucide-react";
import { getRelatedCalculators } from "@/lib/topic-calculators";
import { getTopicColor } from "@/lib/topic-colors";

export function RelatedCalculators({ categorySlug }: { categorySlug?: string | null }) {
  const calculators = getRelatedCalculators(categorySlug);
  if (calculators.length === 0) return null;
  const color = getTopicColor(categorySlug);

  return (
    <div className="rounded-lg border border-border border-t-4 p-5" style={{ borderTopColor: color }}>
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color }}>
        <Calculator className="h-4 w-4" />
        Try it yourself
      </p>
      <ul className="flex flex-wrap gap-2">
        {calculators.map((calc) => (
          <li key={calc.slug}>
            <Link
              href={`/financial-tools/${calc.slug}`}
              className="inline-block rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: color }}
            >
              {calc.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
