
import PredictionsHeader from './components/predictions-header';
import RevenuePredictionsTable from './components/revenue-predictions-table';
import GrowthOpportunities from './components/growth-opportunities';
import RiskAlerts from './components/risk-alerts';

export default function AiPage() {
  return (
    <div className="space-y-8">
      <PredictionsHeader />
      <RevenuePredictionsTable />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <GrowthOpportunities />
        </div>
        <div className="lg:col-span-2">
          <RiskAlerts />
        </div>
      </div>
    </div>
  );
}
