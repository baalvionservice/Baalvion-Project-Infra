import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Text } from "@/design-system/typography/text";

type Props = {
  category: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

/**
 * Editorial header shared by every /financial-tools calculator page —
 * matches the breadcrumb + eyebrow + heading pattern used across the rest
 * of Imperialpedia (HeadingSection, ProductSection, Breadcrumbs) instead of
 * the glass-card/dashboard chrome this section used to carry on its own.
 */
export function CalculatorHeader({ category, title, description, icon: Icon }: Props) {
  return (
    <header className="mb-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
          <Home className="h-3 w-3" />
          Home
        </Link>
        <ChevronRight className="h-3 w-3 opacity-40" />
        <Link href="/financial-tools" className="hover:text-primary transition-colors">
          Financial Tools
        </Link>
        <ChevronRight className="h-3 w-3 opacity-40" />
        <span className="font-semibold text-foreground" aria-current="page">{title}</span>
      </nav>

      <div className="flex items-center gap-2 text-primary mb-3">
        <Icon className="h-4 w-4" />
        <Text variant="caption" className="font-bold uppercase tracking-widest text-xs">
          {category}
        </Text>
      </div>
      <Text variant="h1" as="h1" className="text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-foreground">
        {title}
      </Text>
      <Text variant="body" className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-3xl">
        {description}
      </Text>
    </header>
  );
}
