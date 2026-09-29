"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IrrMetrics } from "@/types/performance";
import { TrendingUp, ArrowUpRight, Wallet, Percent, ShieldCheck } from "lucide-react";
import { Locale, t, formatCurrency, formatPercent, formatDecimal } from "@/utils/i18n";

interface Props {
  metrics: IrrMetrics;
  currentNav: number;
}

export function MetricsSummaryGrid({ metrics, currentNav }: Props) {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('baalvion_locale') as Locale;
    if (saved) setLocale(saved);
  }, []);

  const cards = [
    { 
      title: t("dashboard.metrics.net_irr", locale), 
      value: formatPercent(metrics.netIRR, locale), 
      icon: TrendingUp, 
      color: "text-green-500", 
      desc: "After Management Fees" 
    },
    { 
      title: t("dashboard.metrics.tvpi", locale), 
      value: formatDecimal(metrics.TVPI, locale) + "x", 
      icon: ArrowUpRight, 
      color: "text-blue-500", 
      desc: "Total Value to Paid-In" 
    },
    { 
      title: t("dashboard.metrics.dpi", locale), 
      value: formatDecimal(metrics.DPI, locale) + "x", 
      icon: Wallet, 
      color: "text-primary", 
      desc: "Distributed to Paid-In" 
    },
    { 
      title: t("dashboard.metrics.nav", locale), 
      value: formatCurrency(currentNav, locale), 
      icon: ShieldCheck, 
      color: "text-amber-500", 
      desc: "Market Valuation" 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card/50 border-border/50">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-3 w-3 ${card.color}`} />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold tracking-tighter">{card.value}</div>
            <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-tight">{card.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
