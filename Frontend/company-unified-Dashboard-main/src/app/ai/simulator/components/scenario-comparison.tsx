
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TimeHorizon, Scenario } from '../page';
import { useMemo } from 'react';

interface ScenarioComparisonProps {
  timeHorizon: TimeHorizon;
}

const scenarioAssumptions: Record<Scenario, { revenueGrowth: number; costGrowth: number; expansionRate: number }> = {
  conservative: { revenueGrowth: 8, costGrowth: 10, expansionRate: 1 },
  base: { revenueGrowth: 12, costGrowth: 8, expansionRate: 2 },
  aggressive: { revenueGrowth: 25, costGrowth: 15, expansionRate: 5 },
};

const formatLargeNumber = (num: number) => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export default function ScenarioComparison({ timeHorizon }: ScenarioComparisonProps) {
  
  const calculateProjections = (scenario: Scenario) => {
    const { revenueGrowth, costGrowth, expansionRate } = scenarioAssumptions[scenario];
    const initial = { revenue: 60e6, netWorth: 24.6e6, businesses: 5, employees: 284, countries: 5 };

    return {
      revenue: formatLargeNumber(initial.revenue * Math.pow(1 + revenueGrowth / 100, timeHorizon)),
      netWorth: formatLargeNumber(initial.netWorth * Math.pow(1 + (revenueGrowth - costGrowth) / 100, timeHorizon)),
      businesses: Math.floor(initial.businesses + (expansionRate * timeHorizon / 10)).toLocaleString(),
      employees: Math.floor(initial.employees * Math.pow(1 + (revenueGrowth / 100) * 0.5, timeHorizon)).toLocaleString(),
    };
  };

  const scenarios = useMemo(() => ({
    conservative: calculateProjections('conservative'),
    base: calculateProjections('base'),
    aggressive: calculateProjections('aggressive'),
  }), [timeHorizon]);

  const metrics = ['revenue', 'netWorth', 'businesses', 'employees'];
  const metricLabels: Record<string, string> = {
    revenue: 'Projected Revenue',
    netWorth: 'Projected Net Worth',
    businesses: 'Businesses in Portfolio',
    employees: 'Projected Employees',
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Comparison ({timeHorizon} Years)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-center">Conservative</TableHead>
                <TableHead className="text-center">Base Case</TableHead>
                <TableHead className="text-center">Aggressive</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map(metric => (
                <TableRow key={metric}>
                  <TableCell className="font-medium">{metricLabels[metric]}</TableCell>
                  <TableCell className="text-center font-mono">{scenarios.conservative[metric as keyof typeof scenarios.conservative]}</TableCell>
                  <TableCell className="text-center font-mono font-bold">{scenarios.base[metric as keyof typeof scenarios.base]}</TableCell>
                  <TableCell className="text-center font-mono">{scenarios.aggressive[metric as keyof typeof scenarios.aggressive]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
