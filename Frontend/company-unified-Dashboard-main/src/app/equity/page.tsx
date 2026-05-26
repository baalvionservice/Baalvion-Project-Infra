
import { FileText } from 'lucide-react';
import EquityAccordion from './components/equity-accordion';
import ProfitCalculator from './components/profit-calculator';
import EquityHistory from './components/equity-history';

export default function EquityPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equity Management</h1>
        <p className="text-muted-foreground">
          A comprehensive overview of your ownership and equity distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <EquityAccordion />
            <EquityHistory />
        </div>
        <div className="lg:col-span-1">
            <ProfitCalculator />
        </div>
      </div>
    </div>
  );
}
