'use client';

import React from 'react';
import Link from 'next/link';
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
 * Calculator tile for the /financial-tools hub grid — matches the site's
 * TopicCard/ProductSection convention (white card, gray-100 border,
 * gray-900 hover) instead of a standalone glass/dashboard aesthetic.
 */
export const CalculatorCard = ({ tool }: CalculatorCardProps) => {
  const Icon = iconMap[tool.type] || CalcIcon;

  return (
    <Link
      href={`/financial-tools/${tool.slug}`}
      className="group flex h-full flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 transition-colors hover:border-gray-900"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-colors group-hover:bg-gray-900 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {tool.category}
        </span>
      </div>

      <div className="flex-grow">
        <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
          {tool.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-3">
          {tool.description}
        </p>
      </div>

      <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-foreground group-hover:underline">
        Open calculator
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
};
