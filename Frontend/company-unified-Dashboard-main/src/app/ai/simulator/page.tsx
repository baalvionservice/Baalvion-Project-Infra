
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssumptionsPanel from './components/assumptions-panel';
import ProjectionResults from './components/projection-results';
import ScenarioComparison from './components/scenario-comparison';
import ProjectionChart from './components/projection-chart';

export type TimeHorizon = 5 | 10 | 25 | 50 | 100;
export type Scenario = 'conservative' | 'base' | 'aggressive';

export interface Assumptions {
  revenueGrowth: number;
  costGrowth: number;
  expansionRate: number;
  inflationRate: number;
  discountRate: number;
}

const timeHorizons: TimeHorizon[] = [5, 10, 25, 50, 100];

export default function SimulatorPage() {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>(25);
  const [assumptions, setAssumptions] = useState<Assumptions>({
    revenueGrowth: 12,
    costGrowth: 8,
    expansionRate: 2,
    inflationRate: 3,
    discountRate: 5,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Century Simulator</h1>
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            Project your business empire's growth over the next century.
          </p>
          <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            This is a theoretical simulation for planning purposes only.
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1 lg:sticky lg:top-20">
          <AssumptionsPanel assumptions={assumptions} setAssumptions={setAssumptions} />
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Tabs 
            defaultValue="25"
            onValueChange={(val) => setTimeHorizon(Number(val) as TimeHorizon)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              {timeHorizons.map(th => (
                <TabsTrigger key={th} value={String(th)}>{th} Years</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <ProjectionResults assumptions={assumptions} timeHorizon={timeHorizon} />
          <ProjectionChart assumptions={assumptions} timeHorizon={timeHorizon} />
          <ScenarioComparison timeHorizon={timeHorizon} />
        </div>
      </div>
    </div>
  );
}
