import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { ArrowRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { entityRouteSegment } from '@/lib/utils/seo';
import { isAllowedImageHost } from '@/lib/safe-image';

interface EntityListItemProps {
  name: string;
  type: string;
  category: string;
  description: string;
  slug: string;
  /** Verified brand logo (companies only). Falls back to the generic icon when absent or off-allowlist. */
  logo?: string;
  className?: string;
  /**
   * Overrides the default `/${entityRouteSegment(type)}/${slug}` destination. Required
   * for entity types with no detail page of their own (e.g. "company" — /companies was
   * removed site-wide) where the caller has a real alternative route (e.g. the matching
   * /markets/quote/[symbol] page for a ticker).
   */
  href?: string;
}

/**
 * A refined list item component for knowledge entities.
 */
export const EntityListItem = ({ name, type, category, description, slug, logo, className, href }: EntityListItemProps) => {
  const route = href ?? `/${entityRouteSegment(type)}/${slug}`;
  const logoOk = isAllowedImageHost(logo);

  return (
    <Link href={route} className={cn("group block", className)}>
      <Card className="glass-card h-full transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:border-primary/40 overflow-hidden">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            {logoOk ? (
              <div className="h-10 w-10 rounded-xl border border-primary/20 bg-white overflow-hidden flex items-center justify-center">
                <Image src={logo!} alt={`${name} logo`} width={40} height={40} className="object-contain" />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                <Layers size={18} />
              </div>
            )}
            <Badge variant="secondary" className="bg-background/50 border-white/10 text-[10px] font-bold uppercase tracking-widest">
              {category}
            </Badge>
          </div>
          
          <div className="space-y-2 mb-4 flex-grow">
            <Text variant="h4" className="group-hover:text-primary transition-colors">
              {name}
            </Text>
            <Text variant="bodySmall" className="text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
            </Text>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all uppercase tracking-widest pt-4 border-t border-white/5">
            Audit Node <ArrowRight size={14} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
