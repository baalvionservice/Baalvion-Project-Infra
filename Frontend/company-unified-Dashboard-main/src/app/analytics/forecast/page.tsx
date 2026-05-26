
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import forecastData from '@/lib/data/forecast.json';
import RevenueForecastChart from './components/revenue-forecast-chart';
import AiRecommendations from './components/ai-recommendations';
import ScenarioModeler from './components/scenario-modeler';
import { Separator } from '@/components/ui/separator';

export default function ForecastPage() {
  const { scenarios } = forecastData.revenueForecast;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forecasting & AI Insights</h1>
        <p className="text-muted-foreground">
          Project future performance and discover growth opportunities.
        </p>
      </div>

      <RevenueForecastChart />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conservative</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${scenarios.conservative.toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">End of year projection</p>
          </CardContent>
        </Card>
        <Card className="border-primary border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Case</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${scenarios.baseCase.toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Most likely outcome</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimistic</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${scenarios.optimistic.toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">High-growth scenario</p>
          </CardContent>
        </Card>
      </div>
      
      <Separator />

      <AiRecommendations />
      
      <Separator />

      <ScenarioModeler />

    </div>
  );
}
