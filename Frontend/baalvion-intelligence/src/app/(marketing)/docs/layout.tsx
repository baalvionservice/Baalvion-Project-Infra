import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { docsNav } from "@/lib/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-container section-y grid gap-10 md:grid-cols-[220px_1fr]">
      <aside>
        <nav aria-label="Documentation" className="sticky top-24 space-y-1">
          <Link
            href="/docs"
            className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/50"
          >
            Overview
          </Link>
          {docsNav.map((item) => (
            <Link
              key={item.slug}
              href={item.available ? `/docs/${item.slug}` : "/docs"}
              aria-disabled={!item.available}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            >
              {item.title}
              {!item.available && (
                <Badge variant="secondary" className="text-[10px]">
                  Soon
                </Badge>
              )}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
