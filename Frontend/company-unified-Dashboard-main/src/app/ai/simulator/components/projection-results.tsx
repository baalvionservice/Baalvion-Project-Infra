
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Building, DollarSign, Globe, Users } from 'lucide-react';
import type { Assumptions, TimeHorizon } from '../page';
import { useMemo } from 'react';

interface ProjectionResultsProps {
  assumptions: Assumptions;
  timeHorizon: TimeHorizon;
}

const formatLargeNumber = (num: number) => {
  if (num >= 1e12) {
    return `$${(num / 1e12).toFixed(2)} Trillion`;
  }
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)} Billion`;
  }
  if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)} Million`;
  }
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function ProjectionResults({ assumptions, timeHorizon }: ProjectionResultsProps) {
  const projections = useMemo(() => {
    const initial = {
      revenue: 60_000_000,
      netWorth: 24_600_000,
      businesses: 5,
      employees: 284,
      countries: 5,
    };

    const projectedRevenue = initial.revenue * Math.pow(1 + assumptions.revenueGrowth / 100, timeHorizon);
    const projectedNetWorth = initial.netWorth * Math.pow(1 + (assumptions.revenueGrowth - assumptions.costGrowth) / 100, timeHorizon);
    const projectedBusinesses = initial.businesses + (assumptions.expansionRate * timeHorizon / 10);
    const projectedEmployees = initial.employees * Math.pow(1 + (assumptions.revenueGrowth / 100) * 0.5, timeHorizon); // Assume employee growth is 50% of revenue growth
    const projectedCountries = initial.countries + Math.floor(assumptions.expansionRate * timeHorizon / 10 / 2); // 2 businesses per new country

    return {
      revenue: formatLargeNumber(projectedRevenue),
      netWorth: formatLargeNumber(projectedNetWorth),
      businesses: Math.floor(projectedBusinesses).toLocaleString(),
      employees: Math.floor(projectedEmployees).toLocaleString(),
      countries: Math.floor(projectedCountries).toLocaleString()
    }
  }, [assumptions, timeHorizon]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projections for Year {timeHorizon}</CardTitle>
        <CardDescription>Based on your current assumptions.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-muted/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign /> Projected Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{projections.revenue}</p></CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Briefcase /> Projected Net Worth</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{projections.netWorth}</p></CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Building /> Businesses</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{projections.businesses}</p></CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Users /> Employees</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{projections.employees}</p></CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Globe /> Countries</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{projections.countries}</p></CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
