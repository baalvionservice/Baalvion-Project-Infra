import FxRatesTable from './components/fx-rates-table';
import CurrencyConverter from './components/currency-converter';
import ConsolidatedRevenueTable from './components/consolidated-revenue-table';

export default function CurrenciesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Currencies & FX Rates</h1>
        <p className="text-muted-foreground">
          Monitor exchange rates and convert currencies.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <FxRatesTable />
        </div>
        <div className="lg:col-span-1">
            <CurrencyConverter />
        </div>
      </div>

      <ConsolidatedRevenueTable />
    </div>
  );
}
