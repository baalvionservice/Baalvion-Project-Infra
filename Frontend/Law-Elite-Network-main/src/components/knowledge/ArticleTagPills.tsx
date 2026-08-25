import Link from 'next/link';
import { Tag } from 'lucide-react';

interface Pill {
  label: string;
  href?: string;
}

// No resolved tag-name field on this CMS (only raw tagIds) -- pills use the
// real category/subcategory/jurisdiction fields instead of invented tags.
export function ArticleTagPills({ pills }: { pills: Pill[] }) {
  const items = pills.filter((p) => p.label);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {items.map((pill) => {
        const content = (
          <>
            <Tag className="w-2.5 h-2.5 text-blue-600/70" />
            {pill.label}
          </>
        );
        const className =
          'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide py-1 px-2.5 rounded-full border border-blue-600/20 text-blue-700 bg-blue-50/60';
        return pill.href ? (
          <Link key={pill.label} href={pill.href} className={`${className} hover:bg-blue-100 transition-colors`}>
            {content}
          </Link>
        ) : (
          <span key={pill.label} className={className}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
