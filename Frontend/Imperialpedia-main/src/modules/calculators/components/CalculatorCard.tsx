'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { FinancialCalculator } from '@/types/financial-tools';
import { 
  TrendingUp, 
  CreditCard, 
  PieChart, 
  Sunrise, 
  Layers, 
  ArrowUpRight,
  Calculator as CalcIcon,
  ArrowRight
} from 'lucide-react';

interface CalculatorCardProps {
  tool: FinancialCalculator;
}

const iconMap: Record<string, React.ElementType> = {
  compound: TrendingUp,
  loan: CreditCard,
  investment: PieChart,
  retirement: Sunrise,
  portfolio: Layers,
  inflation: ArrowUpRight,
};

/**
 * A high-fidelity card component for promoting individual financial tools.
 * Features enhanced visual hierarchy and icon overlays.
 */
export const CalculatorCard = ({ tool }: CalculatorCardProps) => {
  const Icon = iconMap[tool.type] || CalcIcon;

  return (
    <Link href={`/financial-tools/${tool.slug}`} className="group block h-full">
      <Card className="glass-card relative flex flex-col h-full overflow-hidden transition-all duration-500 hover:translate-y-[-6px] hover:shadow-2xl hover:border-primary/50 group">
        {/* Visual Background Icon Overlay */}
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 group-hover:rotate-6 pointer-events-none">
          <Icon size={180} />
        </div>

        <CardHeader className="pb-4 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
              <Icon className="h-7 w-7" />
            </div>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/30 text-primary bg-primary/5 px-3 py-1">
              {tool.category}
            </Badge>
          </div>
          <CardTitle className="text-2xl group-hover:text-primary transition-colors leading-tight">
            {tool.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-grow flex flex-col relative z-10">
          <CardDescription className="text-sm leading-relaxed mb-8 text-muted-foreground group-hover:text-foreground/80 transition-colors">
            {tool.description}
          </CardDescription>
          
          <div className="mt-auto flex items-center gap-2 text-xs font-bold text-primary opacity-80 group-hover:opacity-100 transition-opacity">
            Launch Engine <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
