'use client';

import { useQuery } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { commerceMarketsApi } from '@/lib/api/commerce-markets';

export default function MarketsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['commerce', 'markets'],
    queryFn: () => commerceMarketsApi.list().then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

  const markets = data?.markets ?? [];

  return (
    <div>
      <PageHeader
        title="Markets"
        description="Currency, tax and FX for each supported storefront market. Base prices are authored once and converted per market at read time."
      />

      {data && (
        <p className="text-sm text-muted-foreground mb-4">
          Base currency <Badge variant="secondary">{data.baseCurrency}</Badge> · default market{' '}
          <Badge variant="secondary">{data.defaultMarket?.toUpperCase()}</Badge>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" /> Supported markets ({markets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">
              Could not load markets. Ensure commerce-service is running.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Market</th>
                    <th className="py-2 pr-4 font-medium">Currency</th>
                    <th className="py-2 pr-4 font-medium">Locale</th>
                    <th className="py-2 pr-4 font-medium">Tax</th>
                    <th className="py-2 pr-4 font-medium">Tax basis</th>
                    <th className="py-2 pr-4 font-medium">FX (1 base =)</th>
                    <th className="py-2 pr-4 font-medium">Rounding</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map((m) => (
                    <tr key={m.country} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">
                        {m.name}{' '}
                        <span className="text-muted-foreground">({m.country.toUpperCase()})</span>
                      </td>
                      <td className="py-2 pr-4">{m.currency}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{m.locale}</td>
                      <td className="py-2 pr-4">
                        {m.taxType?.replace('_', ' ')} {m.taxRate}%
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant={m.taxInclusive ? 'secondary' : 'outline'}>
                          {m.taxInclusive ? 'Inclusive' : 'Exclusive'}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 tabular-nums">
                        {m.fxRate} {m.currency}
                      </td>
                      <td className="py-2 pr-4 tabular-nums text-muted-foreground">
                        {m.roundTo > 1 ? `nearest ${m.roundTo}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        FX rates are environment-configurable (FX_USD_GBP, FX_USD_AED, …) in commerce-service and
        are the seam for a live FX feed. Tax rates align with the storefront tax config.
      </p>
    </div>
  );
}
