
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import type { Assumptions } from '../page';

interface AssumptionsPanelProps {
  assumptions: Assumptions;
  setAssumptions: React.Dispatch<React.SetStateAction<Assumptions>>;
}

export default function AssumptionsPanel({ assumptions, setAssumptions }: AssumptionsPanelProps) {
  const handleSliderChange = (name: keyof Assumptions) => (value: number[]) => {
    setAssumptions(prev => ({ ...prev, [name]: value[0] }));
  };

  const handleInputChange = (name: keyof Assumptions) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAssumptions(prev => ({ ...prev, [name]: Number(e.target.value) }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assumptions</CardTitle>
        <CardDescription>Adjust the variables to model different future scenarios.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Annual Revenue Growth Rate</Label>
          <div className="flex items-center gap-2">
            <Slider
              min={0} max={50} step={1}
              value={[assumptions.revenueGrowth]}
              onValueChange={handleSliderChange('revenueGrowth')}
            />
            <span className="font-mono text-sm w-12 text-center">{assumptions.revenueGrowth}%</span>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Annual Cost Growth Rate</Label>
          <div className="flex items-center gap-2">
            <Slider
              min={0} max={30} step={1}
              value={[assumptions.costGrowth]}
              onValueChange={handleSliderChange('costGrowth')}
            />
            <span className="font-mono text-sm w-12 text-center">{assumptions.costGrowth}%</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expansion-rate">New Businesses / Decade</Label>
          <Input
            id="expansion-rate"
            type="number" min={0} max={10}
            value={assumptions.expansionRate}
            onChange={handleInputChange('expansionRate')}
          />
        </div>

        <div className="space-y-3">
          <Label>Inflation Rate</Label>
          <div className="flex items-center gap-2">
            <Slider
              min={1} max={10} step={0.5}
              value={[assumptions.inflationRate]}
              onValueChange={handleSliderChange('inflationRate')}
            />
            <span className="font-mono text-sm w-12 text-center">{assumptions.inflationRate.toFixed(1)}%</span>
          </div>
        </div>
        
         <div className="space-y-3">
          <Label>Discount Rate</Label>
          <div className="flex items-center gap-2">
            <Slider
              min={1} max={15} step={0.5}
              value={[assumptions.discountRate]}
              onValueChange={handleSliderChange('discountRate')}
            />
            <span className="font-mono text-sm w-12 text-center">{assumptions.discountRate.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
