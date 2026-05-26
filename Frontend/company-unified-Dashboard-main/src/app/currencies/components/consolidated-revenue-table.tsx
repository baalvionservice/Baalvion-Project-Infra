import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import businesses from "@/lib/data/businesses";
import fxRates from "@/lib/data/fx-rates.json";
import type { Business, FxRate } from "@/lib/types";
import { format } from "date-fns";

const allBusinesses: Business[] = businesses;
const rates: FxRate = fxRates;

export default function ConsolidatedRevenueTable() {
  const businessRevenues = allBusinesses.map((biz) => {
    const fxRate = rates[biz.currency] || 1;
    const usdEquivalent = biz.currentMetrics.revenue / fxRate;
    return {
      ...biz,
      fxRate,
      usdEquivalent,
    };
  });

  const totalGlobalRevenue = businessRevenues.reduce(
    (acc, biz) => acc + biz.usdEquivalent,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consolidated Revenue</CardTitle>
        <CardDescription>
          Business revenues shown in local currency and USD equivalent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead className="text-right">Local Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">USD Equivalent</TableHead>
                <TableHead className="text-right">FX Rate Used</TableHead>
                <TableHead>As of Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businessRevenues.map((biz) => (
                <TableRow key={biz.id}>
                  <TableCell className="font-medium">{biz.name}</TableCell>
                  <TableCell className="text-right">
                    {biz.currentMetrics.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell>{biz.currency}</TableCell>
                  <TableCell className="text-right">
                    $
                    {biz.usdEquivalent.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {biz.fxRate.toFixed(4)}
                  </TableCell>
                  <TableCell>{format(new Date(), "PP")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-bold">
                  Total Global Revenue (USD)
                </TableCell>
                <TableCell colSpan={3} className="text-right font-bold text-lg">
                  $
                  {totalGlobalRevenue.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
