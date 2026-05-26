
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { DollarSign, Users, LineChart } from 'lucide-react';

export default function ScenarioModeler() {
    const [growth, setGrowth] = useState(25);
    const [employees, setEmployees] = useState(284);
    const [marketingSpend, setMarketingSpend] = useState(50000);

    const baseRevenue = 60_000_000;
    const baseProfit = 12_000_000;
    const employeeCost = 80000;
    const marketingMultiplier = 3.5;

    const projectedRevenue = baseRevenue * (1 + growth / 100) + (marketingSpend * marketingMultiplier);
    const projectedCost = (employees * employeeCost) + marketingSpend;
    const projectedProfit = projectedRevenue - baseProfit * (1 + growth / 150) - projectedCost;

  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight mb-4">Scenario Modeler</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Adjust Assumptions</CardTitle>
            <CardDescription>Use the controls to model different scenarios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="growth-slider">Revenue Growth (%)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="growth-slider"
                  min={10}
                  max={100}
                  step={1}
                  value={[growth]}
                  onValueChange={(value) => setGrowth(value[0])}
                />
                <span className="font-bold w-12 text-center">{growth}%</span>
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="employees">Total Employees</Label>
                <Input id="employees" type="number" value={employees} onChange={(e) => setEmployees(Number(e.target.value))} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="marketing">Monthly Marketing Spend ($)</Label>
                <Input id="marketing" type="number" step={1000} value={marketingSpend} onChange={(e) => setMarketingSpend(Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Real-time Projections</CardTitle>
                <CardDescription>Based on your selected assumptions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Card className="bg-muted/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Projected Annual Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">${(projectedRevenue / 1_000_000).toFixed(2)}M</p>
                    </CardContent>
                </Card>
                 <Card className="bg-muted/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Projected Annual Profit</CardTitle>
                        <LineChart className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">${(projectedProfit / 1_000_000).toFixed(2)}M</p>
                    </CardContent>
                </Card>
                 <Card className="bg-muted/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Projected Annual Costs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-600">${(projectedCost / 1_000_000).toFixed(2)}M</p>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
      </div>
    </section>
  );
}
