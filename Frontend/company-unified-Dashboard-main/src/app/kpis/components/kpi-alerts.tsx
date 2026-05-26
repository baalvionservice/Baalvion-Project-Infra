import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Megaphone, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const alerts = [
  {
    type: 'warning',
    title: 'Revenue Below Target',
    description: 'RetailChain UAE revenue is 18% below target for this week.',
  },
  {
    type: 'success',
    title: 'Profit Target Exceeded',
    description: 'TechCorp India exceeded its profit target by 22% this quarter.',
  },
];

export default function KpiAlerts() {
  return (
    <div className="space-y-4">
       <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
        <div className="grid gap-4 md:grid-cols-2">
            {alerts.map((alert, index) => (
                <Alert key={index} className={cn(
                    alert.type === 'warning' && 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-950 dark:border-orange-700 dark:text-orange-300 [&>svg]:text-orange-800 dark:[&>svg]:text-orange-300',
                    alert.type === 'success' && 'bg-green-100 border-green-300 text-green-800 dark:bg-green-950 dark:border-green-700 dark:text-green-300 [&>svg]:text-green-800 dark:[&>svg]:text-green-300'
                )}>
                    {alert.type === 'warning' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                </Alert>
            ))}
        </div>
    </div>
  );
}
