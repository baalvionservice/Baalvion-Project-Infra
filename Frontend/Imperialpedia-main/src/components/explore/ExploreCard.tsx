'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface ExploreCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

/**
 * A sophisticated discovery card for category-based navigation.
 */
export const ExploreCard = ({ icon: Icon, title, description, href }: ExploreCardProps) => {
  return (
    <Link href={href} className="group h-full">
      <Card className="glass-card flex flex-col h-full transition-all duration-500 hover:translate-y-[-8px] hover:shadow-2xl hover:border-primary/40 relative overflow-hidden">
        {/* Background Icon Watermark */}
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 pointer-events-none">
          <Icon size={160} />
        </div>

        <CardContent className="p-8 flex flex-col h-full relative z-10">
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary w-fit mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <Icon size={28} />
          </div>
          
          <Text variant="h3" className="mb-3 group-hover:text-primary transition-colors">
            {title}
          </Text>
          
          <Text variant="bodySmall" className="text-muted-foreground leading-relaxed mb-8 flex-grow">
            {description}
          </Text>

          <div className="flex items-center gap-2 text-xs font-bold text-primary opacity-80 group-hover:opacity-100 transition-opacity uppercase tracking-widest mt-auto">
            Explore Hub <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
