import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import ratesData from '@/lib/data/fx-rates-detailed.json';


export default function FxRatesTable() {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exchange Rates</CardTitle>
        <CardDescription>Live foreign exchange rates to US Dollar.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Rate vs USD</TableHead>
                <TableHead>24h Change</TableHead>
                <TableHead>7d Change</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratesData.map(rate => (
                <TableRow key={rate.code}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <span className='font-mono text-muted-foreground w-4 text-center'>{rate.symbol}</span>
                    <span>{rate.currency}</span>
                  </TableCell>
                  <TableCell>{rate.code}</TableCell>
                  <TableCell className="font-mono">{rate.rate.toFixed(4)}</TableCell>
                  <TableCell>
                     {rate.code !== 'USD' ? (
                        <span className={cn('flex items-center gap-1', rate.change24h > 0 ? 'text-green-600' : 'text-red-600')}>
                          {rate.change24h > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {rate.change24h > 0 ? '+' : ''}{rate.change24h.toFixed(2)}%
                        </span>
                     ) : '—' }
                  </TableCell>
                  <TableCell>
                     {rate.code !== 'USD' ? (
                        <span className={cn('flex items-center gap-1', rate.change7d > 0 ? 'text-green-600' : 'text-red-600')}>
                          {rate.change7d > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {rate.change7d > 0 ? '+' : ''}{rate.change7d.toFixed(2)}%
                        </span>
                     ) : '—' }
                  </TableCell>
                  <TableCell className="text-muted-foreground">{rate.lastUpdated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
