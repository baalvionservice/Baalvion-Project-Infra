import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { JsonLd } from "@/components/seo/JsonLd"

export interface Crumb {
  label: string;
  href?: string; // last crumb (current page) has no href
}

// The concrete "internal linking" deliverable: every PDP/category page links back up its
// department → category chain, and emits BreadcrumbList JSON-LD so search engines see the same
// hierarchy. Server component — no client interactivity needed for a link trail.
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
      <JsonLd data={jsonLd} />
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3 h-3 text-gray-700" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-white transition-colors font-medium">{item.label}</Link>
          ) : (
            <span className="text-gray-300 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
